import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_bank_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('email').after('payment_method_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email')
    })
  }
}