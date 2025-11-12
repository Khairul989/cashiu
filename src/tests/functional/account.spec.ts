import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { test } from '@japa/runner'

test.group('account', (group) => {
  group.setup(async () => {
    await UserFactory.create()
  })

  test('get account information without social account information').run(async ({ client }) => {
    const user = await User.query().preload('socialAccounts').firstOrFail()

    const response = await client
      .get('/api/account')
      .trustLocalhost()
      .accept('json')
      .withGuard('api')
      .loginAs(user)
      .send()

    response.assertStatus(200)
    response.assertBody(user.toJSON())
  })

  test('update notification preference to {$self}')
    .with([true, false])
    .run(async ({ assert, client }, notificationValue) => {
      const user = await User.firstOrFail()

      const request = client
        .post('/api/account')
        .trustLocalhost()
        .accept('json')
        .withGuard('api')
        .loginAs(user)
        .json({ notification: notificationValue })

      const response = await request.send()

      response.assertStatus(204)

      await user.refresh()

      assert.equal(user.notification, notificationValue)
    })
})
