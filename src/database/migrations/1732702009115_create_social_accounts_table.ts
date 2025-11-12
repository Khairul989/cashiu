import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_social_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('provider_id').notNullable()
      table.string('provider_name').notNullable()
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['provider_id', 'provider_name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}