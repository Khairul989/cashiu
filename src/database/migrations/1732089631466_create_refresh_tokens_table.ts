import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_refresh_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('access_token_id').notNullable().references('id').inTable('oauth_access_tokens').onDelete('CASCADE')
      table.boolean('revoked').defaultTo(false)
      table.timestamp('expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}