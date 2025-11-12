import Conversion from '#models/conversion'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  noOfRecords = 500
  async run() {
    if (app.inProduction) {
      return
    }

    const trx = await this.client.transaction()
    const data = []

    try {
      for (let i = 0; i < this.noOfRecords; i++) {
        const saleAmount = 1000 + Math.random() * 1000
        const categories = ['Fashion', 'Electronics', 'Home & Living', 'Health & Beauty', 'Sports', 'Toys', 'Automotive']

        data.push({
          conversionId: Math.floor(100000 + Math.random() * 900000),
          sellerId: 1,
          userId: 1,
          offerId: 103069,
          orderId: Math.floor(100000000 + Math.random() * 900000000).toString(),
          category: categories[Math.floor(Math.random() * categories.length)],
          datetimeConversion: DateTime.local().minus({ days: Math.floor(Math.random() * 30) }),
          myrSaleAmount: saleAmount,
          myrPayout: saleAmount * Math.random() * (0.12 - 0.02) + 0.02,
          sellerCommissionRate: 0.0468468468,
          cashbackPayout: saleAmount * 0.0468468468,
          advSubs: {
            adv_sub: 'adv_sub',
            adv_sub2: 'adv_sub2',
            adv_sub3: 'adv_sub3',
            adv_sub4: 'adv_sub4',
            adv_sub5: 'adv_sub5',
          },
          affSubs: {
            aff_sub: 'aff_sub',
            aff_sub2: 'aff_sub2',
            aff_sub3: 'aff_sub3',
            aff_sub4: 'aff_sub4',
            aff_sub5: 'aff_sub5',
          },
          statusId: [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)],
        })
      }

      await Conversion.createMany(data, { client: trx })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
    }
  }
}
