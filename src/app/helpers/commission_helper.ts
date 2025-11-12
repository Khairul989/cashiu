import Product from '#models/product'
import ReferralProgram from '#models/referral_program'
import Setting from '#models/setting'
import UserReferral from '#models/user_referral'
import cache from '@adonisjs/cache/services/main'
import { floorDecimalPoints } from './number_helper.js'

export const totalCommissionRate = (product: Product, userCommissionRate: number) => {
  return floorDecimalPoints(
    (product.sellerCommissionRate + product.platformCommissionRate) * userCommissionRate,
    4
  )
}

export const minCommissionAmount = (product: Product, userCommissionRate: number) => {
  return floorDecimalPoints(totalCommissionRate(product, userCommissionRate) * product.priceMin)
}

export const maxCommissionAmount = (product: Product, defaultCommissionRate: number) => {
  return floorDecimalPoints(totalCommissionRate(product, defaultCommissionRate) * product.priceMax)
}

export const userCommissionRate = async (
  userId: number | undefined,
  returnLowest: boolean = true
): Promise<number> => {
  return await cache.getOrSet({
    key: `user:${userId}:${returnLowest ? 'lowest' : 'default'}CommissionRate`,
    factory: async () => {
      if (userId) {
        const user = await UserReferral.query()
          .preload('referralProgram', (query) => {
            query.select('id', 'user_rate')
          })
          .select('referral_program_id')
          .where('user_id', userId)
          .first()

        if (user?.referralProgram) {
          return user.referralProgram.userRate
        }
      }

      return returnLowest ? await lowestCommissionRate() : await defaultCommissionRate()
    },
    ttl: 60 * 60 * 24, // 24 hours
  })
}

export const lowestCommissionRate = async (): Promise<number> => {
  return await cache.getOrSet({
    key: 'lowestCommissionRate',
    factory: async () => {
      const lowestCommissionRate = await ReferralProgram.query()
        .select('user_rate')
        .orderBy('user_rate', 'asc')
        .first()

      if (lowestCommissionRate) {
        return lowestCommissionRate.userRate
      }

      return await defaultCommissionRate()
    },
    ttl: 60 * 60 * 24, // 24 hours
  })
}

export const defaultCommissionRate = async (): Promise<number> => {
  return await cache.getOrSet({
    key: 'defaultCommissionRate',
    factory: async () => {
      return await Setting.query()
        .select('value')
        .where('key', 'commission_rate')
        .firstOrFail()
        .then((setting) => parseFloat(setting.value))
    },
    ttl: 60 * 60 * 24, // 24 hours
  })
}
