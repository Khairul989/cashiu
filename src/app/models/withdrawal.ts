import ActionReason from '#models/action_reason'
import Bank from '#models/bank'
import Conversion from '#models/conversion'
import MasterLookup from '#models/master_lookup'
import User from '#models/user'
import { compose } from '@adonisjs/core/helpers'
import { afterSave, BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { hasPermissions } from '@holoyan/adonisjs-permissions'
import { AclModelInterface } from '@holoyan/adonisjs-permissions/types'
import { MorphMap } from '@holoyan/morph-map-js'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'

@MorphMap('withdrawals')
export default class Withdrawal
  extends compose(BaseModel, Auditable, hasPermissions())
  implements AclModelInterface
{
  getModelId(): number {
    return this.id
  }

  static forUser = scope((query, user: User) => {
    query.where('user_id', user.id)
  })

  @afterSave()
  static async createWithdrawalId(withdrawal: Withdrawal) {
    if (!withdrawal.withdrawalId) {
      withdrawal.withdrawalId = this.getWithdrawalId(withdrawal.id)
      await withdrawal.saveQuietly()
    }
  }

  static getWithdrawalId = (id: number) => {
    return `CCW-${id.toString().padStart(6, '0')}`
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare withdrawalId: string

  @column()
  declare userId: number

  @column()
  declare amount: number

  @column()
  declare statusId: number

  @column()
  declare actionReasonId: number | null

  @column()
  declare bankId: number

  @column()
  declare paymentMethodId: number

  @column()
  declare email: string

  @column()
  declare accountHolderName: string

  @column()
  declare accountNumber: string

  @column()
  declare remarks: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Bank)
  declare bank: BelongsTo<typeof Bank>

  @hasMany(() => Conversion)
  declare conversions: HasMany<typeof Conversion>

  @belongsTo(() => MasterLookup, {
    foreignKey: 'statusId',
    onQuery: (query) => {
      query.where('type', 'withdrawal_status').select('id', 'type', 'value')
    },
  })
  declare status: BelongsTo<typeof MasterLookup>

  @belongsTo(() => ActionReason, {
    foreignKey: 'actionReasonId',
  })
  declare actionReason: BelongsTo<typeof ActionReason>

  @belongsTo(() => MasterLookup, {
    foreignKey: 'paymentMethodId',
    onQuery: (query) => {
      query.where('type', 'payment_method').select('id', 'type', 'value')
    },
  })
  declare paymentMethod: BelongsTo<typeof MasterLookup>
}
