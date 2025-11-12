import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'postback_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table
        .integer('postback_id')
        .unsigned()
        .references('id')
        .inTable('postbacks')
        .onDelete('cascade')
      table.text('url').notNullable()
      table.string('method').notNullable().defaultTo('GET')
      table.jsonb('headers').nullable()
      table.jsonb('body').nullable()
      table.integer('status_code').unsigned().notNullable().defaultTo(200)
      table.jsonb('response').nullable()
      table.text('remarks').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
