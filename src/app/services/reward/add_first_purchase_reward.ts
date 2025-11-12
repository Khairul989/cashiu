import Conversion from '#models/conversion'
import Reward from '#models/reward'
import Setting from '#models/setting'
import cache from '@adonisjs/cache/services/main'
import { DateTime } from 'luxon'

export default class AddFirstConversionReward {
  async handle(conversion: Conversion) {
    await conversion.loadOnce('status')

    if (!['approved', 'paid'].some((status) => conversion.status.value.includes(status))) {
      return
    }

    await conversion.loadOnce('user')

    if (conversion.user.convertedAt) {
      console.debug('user already converted')

      return
    }

    const firstPurchaseBonusConfig = (await cache.getOrSet({
      key: 'firstPurchaseBonusConfigs',
      factory: async () => {
        return await Setting.query()
          .where('key', 'like', 'first_purchase_bonus_%')
          .then((settings) => {
            return settings.reduce(
              (acc, config) => {
                acc[config.key.replace('first_purchase_bonus_', '')] = Number(config.value)
                return acc
              },
              {} as { [key: string]: number }
            )
          })
      },
      ttl: 60 * 60 * 24, // 24 hours
    })) as unknown as { enabled: number; amount: number }

    if (!firstPurchaseBonusConfig.enabled) {
      console.debug('first purchase bonus is not enabled')

      return
    }

    const firstPurchaseBonus = new Reward()
    firstPurchaseBonus.module = 'First Purchase Bonus'
    firstPurchaseBonus.currency = 'RM'
    firstPurchaseBonus.amount = firstPurchaseBonusConfig.amount
    firstPurchaseBonus.userId = conversion.userId
    firstPurchaseBonus.statusId = 4 // mark bonus as ready to withdraw
    await firstPurchaseBonus.save()

    if (!conversion.user.convertedAt) {
      await conversion.user
        .merge({
          convertedAt: DateTime.now(),
        })
        .save()
    }
  }
}
