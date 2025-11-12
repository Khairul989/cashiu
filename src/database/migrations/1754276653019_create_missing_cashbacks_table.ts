import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missing_cashbacks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('conversion_id').unsigned().nullable()
      table.bigInteger('user_id').unsigned().notNullable()
      table.string('email').nullable()
      table.string('click_id').notNullable()
      table.string('order_id').nullable()
      table.integer('status_id').unsigned().notNullable()
      table.text('remarks').nullable()
      table.bigInteger('updated_by').unsigned().nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('conversion_id').references('id').inTable('conversions').onDelete('cascade')
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade')
      table.foreign('click_id').references('click_id').inTable('tracking_links').onDelete('cascade')
      table.foreign('status_id').references('id').inTable('master_lookups').onDelete('cascade')
      table.foreign('updated_by').references('id').inTable('users').onDelete('cascade')

      table.index(['user_id', 'status_id', 'order_id'], 'missing_cashbacks_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}