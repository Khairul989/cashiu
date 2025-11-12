import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected referralTable = 'user_referrals'
  protected userTable = 'users'

  async up() {
    this.schema.createTable(this.referralTable, (table) => {
      table.bigIncrements('id')
      table
        .integer('referral_program_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('referral_programs')
      table.bigInteger('user_id').unsigned().references('id').inTable('users')
      table.bigInteger('upline_user_id').unsigned().references('id').inTable('users')
      table.timestamp('converted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()

      table.index(['referral_program_id', 'deleted_at', 'upline_user_id'], 'upline_idx')
      table.index(['referral_program_id', 'deleted_at', 'user_id'], 'user_idx')
    })

    this.schema.table(this.userTable, (table) => {
      table.string('referral_code').nullable().after('api_key').unique()
      table.string('source').nullable().after('referral_code')
      table.timestamp('deleted_at').nullable()

      table.index('referral_code', 'referral_code_idx')
      table.index('source', 'source_idx')
      table.index('deleted_at', 'deleted_at_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.referralTable)

    this.schema.table(this.userTable, (table) => {
      table.dropColumn('referral_code')
      table.dropColumn('source')
      table.dropColumn('deleted_at')
    })
  }
}
