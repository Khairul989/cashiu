import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'platforms'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.integer('offer_id').unsigned()
      table.string('name').notNullable()
      table.string('logo').nullable()
      table.string('banner').nullable()
      table.integer('validation_term').defaultTo(0)
      table.integer('payment_term').defaultTo(0)
      table.string('currency').defaultTo('RM')
      table.string('endpoint')
      table.text('terms').nullable()
      table.text('guidelines').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
