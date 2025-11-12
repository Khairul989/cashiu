import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').nullable()
      table.string('name').notNullable()
      table.string('secret').nullable()
      table.string('provider').nullable()
      table.text('redirect').notNullable()
      table.boolean('personal_access_client').defaultTo(false)
      table.boolean('password_client').defaultTo(false)
      table.boolean('revoked').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
