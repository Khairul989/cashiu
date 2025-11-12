import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const table = 'action_reasons'
    const data = [
      // Withdrawal rejection reasons
      {
        type: 'rejected_withdrawal',
        reason: 'Invalid Bank Account Information',
        description: null,
        suggestion: 'Please verify your account details and resubmit.',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_withdrawal',
        reason: 'Change in Cashback Eligibility',
        description: 'Your cashback no longer meets withdrawal criteria due to recent changes or updates.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      // Withdrawal failed reasons
      {
        type: 'failed_withdrawal',
        reason: 'Invalid or Incorrect Bank Details',
        description: "Your bank details couldn't be verified by the bank.",
        suggestion: 'Please check and update your bank account details and update them before resubmitting withdrawal.',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'failed_withdrawal',
        reason: 'Unsupported Payment Options',
        description: 'We\'re unable to process withdrawals to digital banks or e-wallets at this time.',
        suggestion: 'Please switch to a regular bank account and resubmit withdrawal request.',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'failed_withdrawal',
        reason: 'Others',
        description: null,
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      // Conversion rejection reasons
      {
        type: 'rejected_conversion',
        reason: 'Items Purchased from Multiple Sellers',
        description: 'Cashback only applies to items from the specified seller.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Items Returned, Refunded, Cancelled, or Purchased During Live Events',
        description: 'Cashback isn\'t available for returns, refunds, cancellations, or live-event purchases.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Incorrect Payment Method Used',
        description: 'Cashback requires checkout with approved payment methods.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Duplicate Conversion Detected',
        description: 'Cashback claim has already been recorded and processed.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Items Purchased from Multiple Sellers',
        description: 'Cashback only applies to items from the specified seller.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Items Returned, Refunded, Cancelled, or Purchased During Live Events',
        description:
          "Cashback isn't available for returns, refunds, cancellations, or live-event purchases.",
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Incorrect Payment Method Used',
        description: 'Cashback requires checkout with approved payment methods.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'rejected_conversion',
        reason: 'Duplicate Conversion Detected',
        description: 'Cashback claim has already been recorded and processed.',
        suggestion: null,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
    ]

    for (const type of ['rejected_withdrawal', 'failed_withdrawal', 'rejected_conversion']) {
      const dataToInsert = await db
        .from(table)
        .where('type', type)
        .then((result) => {
          return data
            .filter((item) => item.type === type)
            .filter((item) => !result.some((existingItem) => existingItem.reason === item.reason))
        })

      if (dataToInsert.length > 0) {
        await db.table(table).multiInsert(dataToInsert)
      }
    }
  }
}
