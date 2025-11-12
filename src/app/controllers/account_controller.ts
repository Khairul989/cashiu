import User from '#models/user'
import { updateAccountValidator } from '#validators/account'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class AccountController {
  /**
   * @show
   * @tag Account
   * @operationId getAccount
   * @summary Get the account information
   * @description Get the account information
   * @responseBody 200 - <User>.with(socialAccounts, userReferral)
   * @responseHeader 200 - @use(paginated)
   */
  public async show({ auth, response }: HttpContext) {
    const user: User = auth.use('api').user as User

    await user.load('socialAccounts')
    await user.load('userReferral')

    if (user.userReferral) {
      await user.userReferral.load('referralProgram')
    }

    return response.ok({
      id: user.id,
      uniqueId: user.uniqueId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      apiKey: user.apiKey,
      referralCode: user.referralCode,
      notification: !!user.notification,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      socialAccounts: user.socialAccounts,
      communityProgram: user.userReferral?.referralProgram?.name || null,
      showCommunityBadge: !!user.userReferral?.referralProgram?.isCommunity || false,
      showReferralPopup:
        DateTime.now().diff(user.createdAt, 'days').days <= 7 && !user.userReferral,
    })
  }

  /**
   * @update
   * @tag Account
   * @operationId updateAccount
   * @summary Update the account information
   * @requestBody {"notification": true}
   * @responseBody 204 - {}
   */
  public async update({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateAccountValidator)

    const user: User = auth.use('api').user as User

    if (payload.notification) {
      user.notification = !!payload.notification
    }

    await user.save()

    return response.noContent()
  }

  /**
   * @destroy
   * @tag Account
   * @operationId deleteAccount
   * @summary Delete the account
   * @responseBody 204 - {}
   */
  public async destroy({ response, auth }: HttpContext) {
    const user: User = auth.use('api').user as User
    await user.delete()

    return response.noContent()
  }
}
