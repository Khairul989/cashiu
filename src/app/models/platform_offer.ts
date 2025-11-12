import Platform from '#models/platform'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class PlatformOffer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare platformId: number

  @column()
  declare offerId: number

  @column()
  declare merchantId: number

  @column()
  declare isPrimary: boolean

  @column()
  declare data: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare deletedAt: DateTime

  @belongsTo(() => Platform)
  declare platform: BelongsTo<typeof Platform>
}