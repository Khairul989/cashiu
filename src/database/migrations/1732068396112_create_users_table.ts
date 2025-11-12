import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('unique_id').notNullable().unique()
      table.string('name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').nullable()
      table.boolean('is_admin').defaultTo(false)
      table.text('avatar').nullable()
      table.integer('status_id').unsigned().references('id').inTable('master_lookups')
      table.string('api_key').unique()
      table.boolean('notification').defaultTo(false)
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
