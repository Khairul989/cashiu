import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'referral_programs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('app_rate', 5, 4).notNullable().defaultTo(0.0)
      table.decimal('user_rate', 5, 4).notNullable().defaultTo(0.0)
      table.decimal('referral_rate', 5, 4).notNullable().defaultTo(0.0)
      table.boolean('is_community').notNullable().defaultTo(false)
      table.jsonb('config').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()

      table.index(['deleted_at'])
      table.index(['name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}