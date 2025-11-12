import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'raw_conversions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('conversion_id').unsigned()
      table.text('raw_data')
      table.text('remarks').nullable()
      table.timestamp('processed_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('processed_at', 'processed_at_idx')
      table.index('conversion_id', 'conversion_id_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
