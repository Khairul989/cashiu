import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected conversionTable = 'conversions'
  protected withdrawalTable = 'withdrawals'

  async up() {
    this.schema.alterTable(this.conversionTable, (table) => {
      table
        .integer('action_reason_id')
        .unsigned()
        .references('id')
        .inTable('action_reasons')
        .onDelete('SET NULL')
        .after('status_id')
    })

    this.schema.alterTable(this.withdrawalTable, (table) => {
      table
        .integer('action_reason_id')
        .unsigned()
        .references('id')
        .inTable('action_reasons')
        .onDelete('SET NULL')
        .after('status_id')
    })
  }

  async down() {
    this.schema.alterTable(this.conversionTable, (table) => {
      table.dropColumn('action_reason_id')
    })

    this.schema.alterTable(this.withdrawalTable, (table) => {
      table.dropColumn('action_reason_id')
    })
  }
}
