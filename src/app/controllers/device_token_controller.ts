import DeviceToken from '#models/device_token'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class DeviceTokenController {
  /**
   * @store
   * @tag Device Token
   * @operationId storeDeviceToken
   * @summary Store the device token
   * @requestBody {"token": "string", "info": "string"}
   * @responseBody 201 - {}
   */
  public async store({ request, response, auth }: HttpContext) {
    const { token, info } = request.only(['token', 'info'])

    await db.transaction(async (trx) => {
      await DeviceToken.updateOrCreate(
        {
          token,
          userId: (auth.user as User).id,
        },
        {
          token,
          info,
          userId: (auth.user as User).id,
        },
        { client: trx }
      )
    })

    return response.created()
  }

  /**
   * @destroy
   * @tag Device Token
   * @operationId destroyDeviceToken
   * @summary Destroy the device token
   * @paramPath token - Device token - @type(string) @required
   * @responseBody 204 - []
   */
  public async destroy({ params, response, auth }: HttpContext) {
    await db.transaction(async (trx) => {
      await DeviceToken.query({ client: trx })
        .where('token', params.token)
        .where('user_id', (auth.user as User).id)
        .delete()
    })

    return response.noContent()
  }
}
