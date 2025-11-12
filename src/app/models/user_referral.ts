import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { DateTime } from 'luxon'
import ReferralProgram from './referral_program.js'
import User from './user.js'

export default class UserReferral extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare referralProgramId: number

  @column()
  declare userId: number

  @column()
  declare uplineUserId: number

  @column.dateTime()
  declare convertedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'uplineUserId',
    localKey: 'id',
  })
  declare uplineUser: BelongsTo<typeof User>

  @belongsTo(() => ReferralProgram)
  declare referralProgram: BelongsTo<typeof ReferralProgram>
}
