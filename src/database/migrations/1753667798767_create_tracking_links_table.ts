import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected trackingLinksTable = 'tracking_links'
  protected conversionTable = 'conversions'

  async up() {
    this.schema.createTable(this.trackingLinksTable, (table) => {
      table.bigIncrements('id')
      table.string('click_id').nullable().unique()
      table.bigInteger('product_id').unsigned().notNullable()
      table.bigInteger('user_id').unsigned().nullable()
      table.text('tracking_link').nullable()
      table.string('ip_address').nullable()
      table.text('user_agent').nullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.index(['user_id', 'product_id', 'click_id', 'created_at'], 'idx_01')
    })

    this.schema.table(this.conversionTable, (table) => {
      table.string('click_id', 255).nullable().after('order_id')
    })
  }

  async down() {
    this.schema.dropTable(this.trackingLinksTable)

    this.schema.table(this.conversionTable, (table) => {
      table.dropColumn('click_id')
    })
  }
}
