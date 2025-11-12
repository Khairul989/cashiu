import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rewards'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('status_id')
        .unsigned()
        .references('id')
        .inTable('master_lookups')
        .onDelete('cascade')
        .defaultTo(1)
        .after('withdrawal_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status_id')
    })
  }
}