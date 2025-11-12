import Client from '#models/client'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Client.create({
      id: 'e905a78e-b3eb-4930-94d0-7e3ece73dc73',
      name: 'Cashback App',
      redirect: ['iaseller-auth://appchaching.com/callback'],
    })
  }
}
