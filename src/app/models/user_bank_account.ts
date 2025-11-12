import { compose } from '@adonisjs/core/helpers'
import emitter from '@adonisjs/core/services/emitter'
import { afterCreate, afterUpdate, BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import Bank from './bank.js'
import MasterLookup from './master_lookup.js'
import User from './user.js'

export default class UserBankAccount extends compose(BaseModel, Auditable) {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: number

    @column()
    declare bankId: number

    @column()
    declare paymentMethodId: number

    @column()
    declare email: string

    @column()
    declare accountHolderName: string

    @column()
    declare accountNumber: string // Consider encryption for this field

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @belongsTo(() => Bank)
    declare bank: BelongsTo<typeof Bank>

    @belongsTo(() => MasterLookup, {
      foreignKey: 'paymentMethodId',
      onQuery: (query) => {
        query.where('type', 'payment_method')
             .select('id', 'type', 'value', 'description', 'is_active')
      },
    })
    declare paymentMethod: BelongsTo<typeof MasterLookup>

  /**
   * Emit event after bank account is created
   */
  @afterCreate()
  public static async emitCreatedEvent(userBankAccount: UserBankAccount) {
    emitter.emit('user_bank_account:created' as any, userBankAccount)
  }

  /**
   * Emit event after bank account is updated
   */
  @afterUpdate()
  public static async emitUpdatedEvent(userBankAccount: UserBankAccount) {
    emitter.emit('user_bank_account:updated' as any, userBankAccount)
  }
}
