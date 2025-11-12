import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('id').inTable('users')
      table.string('tag')
      table.string('remarks')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['user_id', 'tag'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}