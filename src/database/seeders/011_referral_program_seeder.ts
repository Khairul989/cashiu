import ReferralProgram from '#models/referral_program'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const data = [
      {
        name: 'Cashiu',
        description: 'Cashiu Referral Program',
        appRate: 0.3,
        userRate: 0.7,
        config: {
          amount_referrer: 2,
          amount_referee: 3,
        },
      },
    ]

    for (const item of data) {
      const referralProgram = await ReferralProgram.firstOrNew({ name: item.name }, item)

      referralProgram.appRate = item.appRate
      referralProgram.userRate = item.userRate
      referralProgram.config = item.config

      await referralProgram.save()
    }
  }
}
