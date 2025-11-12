import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import ace from '@adonisjs/core/services/ace'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('earnings', (group) => {
  group.setup(async () => {
    await UserFactory.create()

    const hasData = await db.from('settings').count('*', 'total').first()
    if (!hasData.total) {
      await ace.exec('db:seed', [])
    }
  })

  test('expect earnings response to be consistent').run(async ({ expect, client }) => {
    const user = await User.firstOrFail()

    const response = await client
      .get(`/api/earnings`)
      .trustLocalhost()
      .accept('json')
      .withGuard('api')
      .loginAs(user)
      .send()

    response.assertStatus(200)
    const keys = [
      'minWithdrawal',
      'availableToWithdraw',
      'totalEarnings',
      'pendingPayment',
      'withdrawn',
      'currency',
    ]

    expect(Object.keys(response.body())).toEqual(keys)

    keys.forEach((key) => {
      expect(response.body()[key]).toBeDefined()

      key === 'currency'
        ? expect(typeof response.body()[key]).toEqual('string')
        : expect(typeof response.body()[key]).toEqual('number')
    })
  })
})
