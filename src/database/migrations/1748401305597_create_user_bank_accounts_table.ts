import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_bank_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .bigInteger('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .unique()
      table
        .integer('bank_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('banks')
        .onDelete('RESTRICT')
      table
        .integer('payment_method_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('master_lookups')
        .onDelete('RESTRICT')
      table.string('account_holder_name', 255).notNullable()
      table.string('account_number', 255).notNullable() // Consider encryption for this field
      table.timestamp('created_at',).notNullable().defaultTo(this.now())
      table.timestamp('updated_at',).notNullable().defaultTo(this.now())

      table.index('bank_id')
      table.index('payment_method_id')
      table.index('account_holder_name')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
