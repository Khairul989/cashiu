import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('seller_id')
        .unsigned()
        .references('id')
        .inTable('sellers')
        .onDelete('CASCADE')
      table.string('platform_item_id').notNullable()
      table.string('name').notNullable()
      table.string('currency').notNullable().defaultTo('RM')
      table.double('price_min').notNullable().defaultTo(0.0)
      table.double('price_max').notNullable().defaultTo(0.0)
      table.string('url').notNullable()
      table.string('image_url').nullable()
      table.decimal('rating', 2, 1).notNullable().defaultTo(0.0)
      table.float('platform_commission_rate').defaultTo(0.0)
      table.float('seller_commission_rate').defaultTo(0.0)
      table.integer('sales').unsigned().defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('platform_item_id', 'platform_item_id_idx')
      table.index('name', 'name_idx')
      table.index(['price_min', 'price_max'], 'price_idx')
      table.index('rating', 'rating_idx')
      table.index('sales', 'sales_idx')
      table.index('created_at', 'created_at_idx')
      table.index(['seller_commission_rate', 'platform_commission_rate'], 'commission_rate_idx')
      table.index(['seller_id', 'name', 'sales'], 'seller_id_name_sales_idx')
      table.unique(['seller_id', 'platform_item_id'], {
        indexName: 'seller_id_platform_item_id_idx',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
