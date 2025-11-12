import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('client_id').notNullable().references('id').inTable('oauth_clients').onDelete('CASCADE')
      table.string('name').nullable()
      table.string('scopes').nullable()
      table.boolean('revoked').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}