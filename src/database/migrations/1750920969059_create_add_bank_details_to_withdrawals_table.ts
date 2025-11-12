import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'withdrawals'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add withdrawal_id after id column
      table.string('withdrawal_id', 255).after('id').index('withdrawal_id_index')

      // Add bank-related columns after status_id
      table
        .integer('bank_id')
        .unsigned()
        .references('id')
        .inTable('banks')
        .onDelete('SET NULL')
        .after('status_id')
      table.string('email', 255).after('payment_method_id')
      table.string('account_holder_name', 255).after('email')
      table.string('account_number', 255).after('account_holder_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('withdrawal_id')
      table.dropColumn('bank_id')
      table.dropColumn('payment_method_id')
      table.dropColumn('email')
      table.dropColumn('account_holder_name')
      table.dropColumn('account_number')
    })
  }
}
