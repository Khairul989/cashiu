import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'platform_offers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .bigInteger('platform_id')
        .unsigned()
        .references('id')
        .inTable('platforms')
        .onDelete('cascade')
      table.integer('offer_id').unsigned()
      table.integer('merchant_id').unsigned()
      table.json('data').nullable()
      table.boolean('is_primary').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()

      table.unique(['platform_id', 'offer_id', 'merchant_id'])
    })

    this.schema.alterTable('platforms', (table) => {
      table.dropColumn('offer_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)

    this.schema.alterTable('platforms', (table) => {
      table.integer('offer_id').unsigned().after('id')
    })
  }
}
