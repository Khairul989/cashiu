import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'withdrawals'
  protected triggerName = 'before_delete_withdrawals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.decimal('amount')
      table
        .integer('payment_method_id')
        .unsigned()
        .references('id')
        .inTable('master_lookups')
        .onDelete('CASCADE')
      table
        .integer('status_id')
        .unsigned()
        .references('id')
        .inTable('master_lookups')
        .onDelete('CASCADE')
      table.text('remarks').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    const jsonObject = {
      id: 'OLD.id',
      user_id: 'OLD.user_id',
      amount: 'OLD.amount',
      payment_method_id: 'OLD.payment_method_id',
      status_id: 'OLD.status_id',
      remarks: 'OLD.remarks',
      created_at: 'OLD.created_at',
      updated_at: 'OLD.updated_at',
    }

    this.schema.raw(`
      CREATE TRIGGER ${this.triggerName}
      BEFORE DELETE ON ${this.tableName}
      FOR EACH ROW
      BEGIN
        INSERT INTO deleted_models (\`key\`, \`model\`, \`values\`, \`created_at\`, \`updated_at\`)
        VALUES (
          OLD.id,
          '${this.tableName}',
          JSON_OBJECT(${Object.entries(jsonObject)}),
          NOW() + INTERVAL 8 HOUR,
          NOW() + INTERVAL 8 HOUR
        );
      END
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw(`
      DROP TRIGGER IF EXISTS ${this.triggerName};
    `)
  }
}
