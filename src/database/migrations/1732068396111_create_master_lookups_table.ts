import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'master_lookups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('type', 50).index()
      table.string('value', 25).index()
      table.boolean('is_active').defaultTo(true)
      table.text('description').nullable()
      table.timestamp('created_at').index()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
