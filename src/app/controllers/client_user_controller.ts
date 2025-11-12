import { simplePaginate } from '#helpers/paginate_helper'
import Client from '#models/client'
import User from '#models/user'
import { clientUserIndexValidator } from '#validators/client_user'
import type { HttpContext } from '@adonisjs/core/http'

export default class ClientUserController {
  /**
   * @index
   * @tag Client Users
   * @operationId getClientUsers
   * @summary Get all client users
   * @paramQuery email - Email - @type(string)
   * @paramQuery name - Name - @type(string)
   * @paramQuery referralCode - Referral Code - @type(string)
   * @paramUse(limiter)
   */
  public async index({ request, response, session }: HttpContext) {
    const clientId = session.get('client_id')

    if (!clientId) {
      return response.badRequest({ message: 'Client not found' })
    }

    const client = await Client.findOrFail(clientId)

    if (client.name?.toLowerCase()?.includes('cashback app')) {
      return response.badRequest({ message: 'Client not found' })
    }

    const payload = await request.validateUsing(clientUserIndexValidator)
    const email = payload.email
    const name = payload.name
    const referralCode = payload.referralCode
    const page = payload.page || 1
    const limit = payload.limit || 10

    const userQuery = User.query()
      .preload('userReferral', (query) => query.preload('uplineUser'))
      .where('source', client.name?.toLowerCase())

    if (email) {
      userQuery.where('email', email)
    }

    if (name) {
      userQuery.where('name', 'like', `%${name}%`)
    }

    if (referralCode) {
      userQuery.where('referral_code', referralCode)
    }

    const users = await simplePaginate(
      userQuery,
      page,
      limit,
      request.url(),
      request.qs(),
      (data) => {
        return data.map((user) => {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            referral_code: user.referralCode,
            created_at: user.createdAt,
            upline_user: user.userReferral?.uplineUser
              ? {
                  id: user.userReferral.uplineUser.id,
                  name: user.userReferral.uplineUser.name,
                  email: user.userReferral.uplineUser.email,
                  referral_code: user.userReferral.uplineUser.referralCode,
                }
              : null,
          }
        })
      }
    )

    return response.ok(users)
  }
}
