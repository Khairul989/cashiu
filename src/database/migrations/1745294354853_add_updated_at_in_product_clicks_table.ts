import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_clicks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('updated_at').nullable().defaultTo(this.now()).after('created_at')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('updated_at')
    })
  }
}