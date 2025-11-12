import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('category_id').nullable().after('discount_rate')
      table.json('category_tree').nullable().after('category_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category_id')
      table.dropColumn('category_tree')
    })
  }
}