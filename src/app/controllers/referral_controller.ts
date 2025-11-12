import { simplePaginate } from '#helpers/paginate_helper'
import { maskEmail } from '#helpers/string_helper'
import ReferralProgram from '#models/referral_program'
import Reward from '#models/reward'
import User from '#models/user'
import UserReferral from '#models/user_referral'
import AddReferralReward from '#services/reward/add_referral_reward'
import cache from '@adonisjs/cache/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ReferralController {
  /**
   * @index
   * @tag Referral
   * @operationId getReferral
   * @summary Get downline users
   * @paramUse(limiter)
   */
  public async index({ auth, request, response }: HttpContext) {
    const user = auth.use('api').user as User
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const downlineUsersQuery = UserReferral.query()
      .where('upline_user_id', user.id)
      .preload('user', (query) => {
        query.select('id', 'name', 'email')
      })
      .preload('referralProgram', (query) => {
        query.select('id', 'name')
      })

    const downlineUsers = await simplePaginate(
      downlineUsersQuery,
      page,
      limit,
      request.url(),
      request.qs(),
      (data) => {
        return data.map((userReferral) => {
          return {
            name: userReferral.user.name,
            email: maskEmail(userReferral.user.email),
            createdAt: userReferral.createdAt,
            status: userReferral.convertedAt ? 'approved' : 'tracking',
          }
        })
      }
    )

    return response.ok(downlineUsers)
  }

  /**
   * @store
   * @tag Referral
   * @operationId storeReferral
   * @summary Store the referral code
   * @requestBody {"referralCode": "string"}
   * @responseBody 204 - {}
   */
  public async store({ auth, request, response }: HttpContext) {
    const user = auth.use('api').user as User
    const referralCode = request.input('referralCode')

    if (!referralCode) {
      return response.badRequest({
        message: 'Referral code is required',
      })
    }

    // grace period is 7 days in seconds
    if (DateTime.now().diff(user.createdAt, 'seconds').seconds > 604800) {
      return response.badRequest({
        message: 'Referral grace period has expired',
      })
    }

    await user.loadOnce('userReferral')

    // if user already has already submitted a referral code, return error
    if (user.userReferral) {
      return response.badRequest({
        message: 'User already has a referral',
      })
    }

    const uplineUser = await User.query()
      .preload('userReferral', (query) => {
        query.preload('referralProgram')
      })
      .where('referral_code', referralCode)
      .where('id', '!=', user.id)
      .firstOrFail()

    const defaultReferralProgram = await cache.getOrSet({
      key: 'defaultReferralProgram',
      factory: async () => {
        return await ReferralProgram.query().orderBy('id', 'asc').firstOrFail()
      },
      ttl: 60 * 60 * 24, // 24 hours
    })

    await user.related('userReferral').create({
      referralProgramId: uplineUser.userReferral?.referralProgramId || defaultReferralProgram.id,
      userId: user.id,
      uplineUserId: uplineUser.id,
    })

    const addReferralReward = new AddReferralReward()
    const referralConfig = await addReferralReward.getReferralConfig()
    const amountReferee = Number(
      uplineUser.userReferral?.referralProgram?.config?.amount_referee ||
        defaultReferralProgram.config?.amount_referee ||
        '0'
    )

    if (referralConfig.enabled && amountReferee > 0) {
      const refereeReward = new Reward()
      refereeReward.module = addReferralReward.moduleName
      refereeReward.currency = 'RM'
      refereeReward.amount = amountReferee
      refereeReward.userId = user.id
      refereeReward.remarks = 'Referred by User ID: ' + uplineUser.id
      refereeReward.metadata = addReferralReward.pendingMetadata
      await refereeReward.save()
    }

    return response.noContent()
  }
}
