import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'referral_program_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.integer('referral_program_id').unsigned().references('id').inTable('referral_programs')
      table.bigInteger('product_id').unsigned().references('id').inTable('products')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['referral_program_id', 'product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
