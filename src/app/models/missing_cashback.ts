import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import MasterLookup from './master_lookup.js'
import TrackingLink from './tracking_link.js'
import User from './user.js'

export default class MissingCashback extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversionId: number | null

  @column()
  declare userId: number

  @column()
  declare email: string | null

  @column()
  declare clickId: string

  @column()
  declare orderId: string | null

  @column()
  declare statusId: number

  @column()
  declare remarks: string | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MasterLookup, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof MasterLookup>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => TrackingLink, {
    foreignKey: 'clickId',
    localKey: 'clickId',
  })
  declare trackingLink: BelongsTo<typeof TrackingLink>
}
