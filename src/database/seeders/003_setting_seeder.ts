import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const data = [
      {
        key: 'involve_link',
        value: 'https://invol.co/aff_m',
      },
      {
        key: 'aff_sys_id',
        value: '1096885',
      },
      {
        key: 'min_withdrawal',
        value: '10',
      },
      {
        key: 'aff_id',
        value: '1016390',
      },
      {
        key: 'commission_rate',
        value: '0.7',
      },
      {
        key: 'referral_reward_enabled',
        value: '0',
      },
      {
        key: 'first_purchase_bonus_enabled',
        value: '0',
      },
      {
        key: 'first_purchase_bonus_amount',
        value: '3',
      }
    ]

    const dataToInsert = await db
      .from('settings')
      .then((result) => {
        return data.filter((item) => !result.find((resultItem) => resultItem.key === item.key))
      })
      .then((result) => {
        return result.map((item) => {
          return {
            key: item.key,
            value: item.value,
            created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
            updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
          }
        })
      })

    if (dataToInsert.length > 0) {
      await db.table('settings').multiInsert(dataToInsert)
    }
  }
}
