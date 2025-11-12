import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversions'
  protected triggerName = 'before_delete_conversions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('conversion_id').unsigned().unique()
      table
        .bigInteger('seller_id')
        .unsigned()
        .references('id')
        .inTable('sellers')
        .onDelete('CASCADE')
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('offer_id').unsigned()
      table.string('order_id').nullable()
      table.string('category').nullable()
      table.timestamp('datetime_conversion')
      table.decimal('myr_sale_amount')
      table.decimal('myr_payout')
      table.jsonb('adv_subs').nullable()
      table.jsonb('aff_subs').nullable()
      table
        .integer('status_id')
        .unsigned()
        .references('id')
        .inTable('master_lookups')
        .onDelete('CASCADE')
      table.integer('withdrawal_id').unsigned().nullable().references('id').inTable('withdrawals')
      table.timestamp('remarks').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['seller_id', 'user_id', 'status_id'])
      table.index(['datetime_conversion'])
      table.index(['user_id', 'status_id', 'withdrawal_id', 'updated_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
