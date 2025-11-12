import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import Withdrawal from '#models/withdrawal'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  noOfRecords = 10
  async run() {
    const trx = await this.client.transaction()
    try {
      const paymentMethods = await getKeyByLookUpType('payment_method')
      const withdrawalStatus = await getKeyByLookUpType('withdrawal_status')

      for (let i = 0; i < this.noOfRecords; i++) {
        const amountWithdrawn = Math.floor(Math.random() * 500) + 1 // Random amount between 1 and 500

        // create a withdrawal
        const withdrawal = await Withdrawal.create(
          {
            userId: 1,
            amount: amountWithdrawn,
            email: 'john.doe@example.com',
            paymentMethodId:
              paymentMethods[['bank_transfer', 'paypal'][Math.floor(Math.random() * 2)]],
            statusId: withdrawalStatus['requested'],
            bankId: 1,
            accountHolderName: 'John Doe',
            accountNumber: '1234567890',
          },
          { client: trx }
        )

        // create multiple conversions for created withdrawal based on the amount withdrawn, each conversion will have a random amount but total amount will be equal to the amount withdrawn
        const noOfConversions = Math.floor(Math.random() * 5) + 1 // Random number of conversions between 1 and 5
        const conversionAmounts = []
        let totalAmount = 0
        for (let j = 0; j < noOfConversions; j++) {
          const conversionAmount = Math.floor(Math.random() * amountWithdrawn) + 1
          conversionAmounts.push(conversionAmount)
          totalAmount += conversionAmount
        }

        // create conversions
        for (let j = 0; j < noOfConversions; j++) {
          await withdrawal.related('conversions').create({
            conversionId: Math.floor(100000 + Math.random() * 900000),
            sellerId: 1,
            userId: 1,
            offerId: 103069,
            orderId: Math.floor(100000000 + Math.random() * 900000000).toString(),
            category: 'Fashion',
            datetimeConversion: DateTime.local().minus({ days: Math.floor(Math.random() * 30) }),
            myrSaleAmount: conversionAmounts[j],
            myrPayout: conversionAmounts[j] * Math.random() * (0.12 - 0.02) + 0.02,
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
            statusId: 4,
            withdrawalId: withdrawal.id,
          })
        }

        await trx.commit()
      }
    } catch (error) {
      await trx.rollback()
    }
  }
}
