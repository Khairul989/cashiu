import { UserFactory } from '#database/factories/user_factory'
import DeviceToken from '#models/device_token'
import User from '#models/user'
import { test } from '@japa/runner'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'

test.group('device', async (group) => {
  group.setup(async () => {
    await UserFactory.create()
  })

  test('able to store new device id and info').run(async ({ assert, client }) => {
    await DeviceToken.truncate()

    const user = await User.firstOrFail()
    const deviceInfo = {
      token: randomBytes(16).toString('hex'),
      info: 'iPhone 16 Pro Max',
    }

    const response = await client
      .post('/api/device')
      .trustLocalhost()
      .accept('json')
      .withGuard('api')
      .loginAs(user)
      .json(deviceInfo)
      .send()

    response.assertStatus(201)

    await user.load('deviceTokens')

    assert.lengthOf(user.deviceTokens, 1)
    assert.equal(user.deviceTokens[0].token, deviceInfo.token)
    assert.equal(user.deviceTokens[0].info, deviceInfo.info)
    assert.equal(user.deviceTokens[0].userId, user.id)
    assert.equal(
      user.deviceTokens[0].expiredAt?.toISODate(),
      DateTime.local().plus({ days: 60 }).toISODate()
    )
  })

  test('able to delete device id').run(async ({ assert, client }) => {
    const user = await User.query().preload('deviceTokens').firstOrFail()

    const response = await client
      .delete(`/api/device/${user.deviceTokens[0].token}`)
      .trustLocalhost()
      .accept('json')
      .withGuard('api')
      .loginAs(user)
      .send()

    response.assertStatus(204)

    await user.load('deviceTokens')

    assert.lengthOf(user.deviceTokens, 0)
  })

  test('unable to delete device id that does not belong to the user').run(
    async ({ assert, client }) => {
      const user = await User.query().firstOrFail()
      const anotherUser = await UserFactory.create()
      const deviceInfo = {
        token: randomBytes(16).toString('hex'),
        info: 'iPhone 16 Pro Max',
      }

      await client
        .post('/api/device')
        .trustLocalhost()
        .accept('json')
        .withGuard('api')
        .loginAs(user)
        .json(deviceInfo)
        .send()

      await user.load('deviceTokens')

      const response = await client
        .delete(`/api/device/${user.deviceTokens[0].token}`)
        .trustLocalhost()
        .accept('json')
        .withGuard('api')
        .loginAs(anotherUser)
        .send()

      response.assertStatus(204)

      await user.load('deviceTokens')

      assert.lengthOf(user.deviceTokens, 1)
    }
  )
})
