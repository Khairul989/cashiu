import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_auth_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 100).primary()
      table
        .bigInteger('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('client_id')
        .notNullable()
        .references('id')
        .inTable('oauth_clients')
        .onDelete('CASCADE')
      table.text('scopes').nullable()
      table.text('redirect')
      table.string('code_challenge')
      table.enum('code_challenge_method', ['plain', 'S256'])
      table.boolean('revoked').defaultTo(false)
      table.timestamp('expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
