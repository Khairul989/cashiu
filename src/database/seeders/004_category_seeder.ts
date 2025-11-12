import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const skipSeeder = await db
      .from('categories')
      .count('*', 'total')
      .then((result) => result[0].total > 0)

    if (skipSeeder) {
      return
    }

    await db.table('categories').multiInsert([
      {
        name: 'Shopee Mall',
        description: 'Product offers from official shops / Shopee Mall sellers',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        name: 'Shopee Preferred',
        description: 'Product offers from preferred sellers',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
      {
        name: 'Shopee Preferred+',
        description: 'Product offers from preferred plus shops',
        created_at: DateTime.local().toString(),
        updated_at: DateTime.local().toString(),
      },
    ])
  }
}
