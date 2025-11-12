import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import MissingCashback from '#models/missing_cashback'
import User from '#models/user'
import { storeMissingCashbackValidator } from '#validators/missing_cashback'
import type { HttpContext } from '@adonisjs/core/http'

export default class MissingCashbackController {
  /**
   * @store
   * @tag Missing Cashback
   * @description Report missing cashback
   * @operationId storeMissingCashback
   * @summary Report missing cashback
   * @paramQuery clickId - Click ID - @type(string) @required
   * @paramQuery orderId - Order ID - @type(string) @required
   * @paramQuery email - User email (optional) - @type(string)
   */
  public async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(storeMissingCashbackValidator)
    const user = auth.use('api').user as User

    await MissingCashback.create({
      userId: user.id,
      email: payload.email || null,
      clickId: payload.clickId,
      orderId: payload.orderId,
      statusId: (await getKeyByLookUpType('missing_cashback_status'))['open'],
    })

    return response.noContent()
  }
}
