import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversions'

  async up() {
    this.schema.table('conversions', (table) => {
      table
        .bigInteger('product_id')
        .unsigned()
        .nullable()
        .after('seller_id')
        .references('id')
        .inTable('products')
        .onDelete('SET NULL')
        table.decimal('cashback_payout', 8, 2).after('myr_payout')
        table.double('seller_commission_rate', 4, 4).nullable().after('myr_payout')
    })

    this.schema.table('products', (table) => {
      table.bigInteger('clicks').defaultTo(0).after('sales')
      table.decimal('discount_rate', 4, 4).defaultTo(0.0).after('price_max')
    })

    this.schema.table('sellers', (table) => {
      table.timestamp('last_synced_at').nullable().after('is_featured')
      table.dropColumn('has_finished_fetching_products')
    })
  }

  async down() {
    this.schema.table('conversions', (table) => {
      table.dropColumn('product_id')
      table.dropColumn('seller_commission_rate')
    })

    this.schema.table('products', (table) => {
      table.dropColumn('clicks')
      table.dropColumn('discount_rate')
    })

    this.schema.table('sellers', (table) => {
      table.dropColumn('last_synced_at')
      table.boolean('has_finished_fetching_products').defaultTo(false).after('is_featured')
    })
  }
}
