import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sellers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('platform_id')
        .unsigned()
        .references('id')
        .inTable('platforms')
        .onDelete('CASCADE')
      table.string('platform_seller_id').notNullable()
      table.string('name').notNullable()
      table.string('image_url').nullable()
      table.string('banner_url').nullable()
      table.double('commission_rate', 4, 4).defaultTo(0.0000)
      table.decimal('rating', 2, 1).defaultTo(0.0)
      table.boolean('is_active').defaultTo(true)
      table.boolean('is_featured').defaultTo(false)
      table.boolean('has_finished_fetching_products').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['platform_id', 'platform_seller_id'], { indexName: 'platform_seller_unique' })
      table.index('name')
      table.index('rating')
      table.index('commission_rate')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
