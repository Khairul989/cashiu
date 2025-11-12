import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rewards'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.string('module').notNullable()
      table.string('currency').notNullable()
      table.integer('amount').notNullable()
      table
        .integer('withdrawal_id')
        .unsigned()
        .references('id')
        .inTable('withdrawals')
        .onDelete('cascade')
      table.jsonb('metadata').nullable()
      table.text('remarks').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
