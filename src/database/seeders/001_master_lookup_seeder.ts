import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const data = [
      {
        type: 'conversion_status',
        value: 'pending',
        description: 'Conversion is pending',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'approved',
        description: 'Conversion is approved',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'rejected',
        description: 'Conversion is rejected',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'paid',
        description: 'Conversion is paid',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'yet to consume',
        description: 'Conversion is yet to consume',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'withdrawal_status',
        value: 'requested',
        description: 'User requested withdrawal',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'withdrawal_status',
        value: 'processing',
        description: 'Withdrawal request is being processed',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'withdrawal_status',
        value: 'rejected',
        description: 'Withdrawal request is rejected',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'withdrawal_status',
        value: 'completed',
        description: 'User has been paid',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'withdrawal_status',
        value: 'failed',
        description: 'Withdrawal request is failed',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'payment_method',
        value: 'bank_transfer',
        description: 'Bank Transfer',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'payment_method',
        value: 'paypal',
        description: 'Paypal',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'deleted',
        description: 'Conversion is deleted',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'processing',
        description: 'Conversion is processing',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'failed',
        description: 'Conversion is failed',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'overpaid',
        description: 'Conversion is overpaid',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'bad debts',
        description: 'Conversion is bad debts',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'recovering',
        description: 'Conversion is recovering',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'invalid',
        description: 'Conversion is invalid',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'conversion_status',
        value: 'generating',
        description: 'Conversion is generating',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'missing_cashback_status',
        value: 'open',
        description: 'Missing cashback is not yet attended',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'missing_cashback_status',
        value: 'ongoing',
        description: 'Admin is checking the missing cashback',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        type: 'missing_cashback_status',
        value: 'done',
        description: 'Admin has checked the missing cashback',
        is_active: true,
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
    ]

    for (const type of ['conversion_status', 'withdrawal_status', 'payment_method', 'missing_cashback_status']) {
      const dataToInsert = await db
        .from('master_lookups')
        .where('type', type)
        .then((result) => {
          return data
            .filter((item) => item.type === type)
            .filter((item) => !result.some((existingItem) => existingItem.value === item.value))
        })

      if (dataToInsert.length > 0) {
        await db.table('master_lookups').multiInsert(dataToInsert)
      }
    }
  }
}
