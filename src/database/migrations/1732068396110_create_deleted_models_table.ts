import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'deleted_models'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('key', 40)
      table.string('model')
      table.jsonb('values')
      table.timestamps({ useTimestamps: true })

      table.unique(['model', 'key'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
