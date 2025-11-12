import Conversion from '#models/conversion'
import Reward from '#models/reward'
import Setting from '#models/setting'
import cache from '@adonisjs/cache/services/main'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class AddReferralReward {
  moduleName = 'Welcome Reward'
  pendingMetadata = {
    title: 'Hey there, welcome aboard!',
    body: "Just make your first purchase through Cashiu. We'll track your order and send your RM3 bonus in your earnings wallet once your cashback is Ready.",
  }
  readyMetadata = {
    title: 'Nice work, buddy!',
    body: "Your bonus_amount bonus is now in your earnings wallet. Keep using Cashiu for your next shop and we'll help you earn cashback every time.",
  }

  async handle(conversion: Conversion) {
    await conversion.loadOnce('status')

    if (!['approved', 'paid'].some((status) => conversion.status.value.includes(status))) {
      return
    }

    await conversion.loadOnce('user')

    if (conversion.user) {
      await conversion.user.loadOnce('userReferral')
    }

    if (conversion.user.userReferral) {
      await conversion.user.userReferral.loadOnce('referralProgram')
    }

    const userReferral = conversion.user.userReferral
    const referralProgram = userReferral?.referralProgram

    // user not registered through referral program
    if (!userReferral) {
      console.debug('user not registered through referral program')

      return
    }

    // referee already converted
    if (userReferral.convertedAt) {
      console.debug('referee already converted')

      return
    }

    // no referral program
    if (!referralProgram) {
      console.debug('no referral program')

      return
    }

    const referralConfig = await this.getReferralConfig()

    if (!referralConfig.enabled) {
      console.debug('referral reward is not enabled')

      return
    }

    if (!referralProgram.config?.amount_referrer && !referralProgram.config?.amount_referee) {
      console.debug('referral program config is not set')

      return
    }

    const uplineUserId = userReferral.uplineUserId
    const amountReferrer = parseFloat(referralProgram.config.amount_referrer || 0)
    const amountReferee = parseFloat(referralProgram.config.amount_referee || 0)

    await db.transaction(async (trx) => {
      if (amountReferrer > 0) {
        let title = this.readyMetadata.title
        let body = this.readyMetadata.body

        body = body.replace('bonus_amount', `RM${amountReferrer}`)

        const metadata = {
          title,
          body,
        }

        const referrerReward = new Reward()
        referrerReward.module = 'Referral Reward'
        referrerReward.currency = 'RM'
        referrerReward.amount = Number(amountReferrer)
        referrerReward.userId = uplineUserId
        referrerReward.remarks = 'Referee User ID: ' + conversion.userId
        referrerReward.statusId = 4 // mark bonus as ready to withdraw
        referrerReward.metadata = metadata
        referrerReward.useTransaction(trx)
        await referrerReward.save()
      }

      if (amountReferee > 0) {
        let title = this.readyMetadata.title
        let body = this.readyMetadata.body

        body = body.replace('bonus_amount', `RM${amountReferee}`)

        const metadata = {
          title,
          body,
        }

        const refereeReward = await Reward.query()
          .where('user_id', conversion.userId)
          .where('module', this.moduleName)
          .where('status_id', 1) // pending reward
          .where('remarks', 'Referred by User ID: ' + uplineUserId)
          .first()

        if (refereeReward) {
          refereeReward.statusId = 4 // mark bonus as ready to withdraw
          refereeReward.metadata = metadata
          refereeReward.useTransaction(trx)
          await refereeReward.save()
        }
      }

      await userReferral
        .merge({
          convertedAt: DateTime.now(),
        })
        .save()
    })
  }

  async getReferralConfig(): Promise<{ enabled: boolean }> {
    return (await cache.getOrSet({
      key: 'referralConfigs',
      factory: async () => {
        return await Setting.query()
          .where('key', 'referral_reward_enabled')
          .then((settings) => {
            return settings.reduce(
              (acc, config) => {
                acc[config.key.replace('referral_reward_', '')] = !!config.value
                return acc
              },
              {} as { [key: string]: boolean }
            )
          })
      },
      ttl: 60 * 60 * 24, // 24 hours
    })) as unknown as { enabled: boolean }
  }
}
