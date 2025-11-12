import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import MasterLookup from './master_lookup.js'
import User from './user.js'
import Withdrawal from './withdrawal.js'

export default class Reward extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare module: string

  @column({
    prepare: (value) => value.toUpperCase(),
  })
  declare currency: string

  @column()
  declare amount: number

  @column()
  declare withdrawalId: number | null

  @column()
  declare statusId: number

  @column({
    prepare: (value: any) => JSON.stringify(value),
  })
  declare metadata: Record<string, any> | null

  @column()
  declare remarks: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Withdrawal)
  declare withdrawal: BelongsTo<typeof Withdrawal>

  @belongsTo(() => MasterLookup, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof MasterLookup>
}
