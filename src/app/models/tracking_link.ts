import { generateRandomId } from '#helpers/url_helper'
import { BaseModel, beforeSave, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Conversion from './conversion.js'
import MissingCashback from './missing_cashback.js'
import Product from './product.js'

export default class TrackingLink extends BaseModel {
  @beforeSave()
  static generateClickId(trackingLink: TrackingLink) {
    if (!trackingLink.clickId) {
      trackingLink.clickId = generateRandomId()
    }
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clickId: string

  @column()
  declare productId: number

  @column()
  declare userId: number

  @column()
  declare trackingLink: string

  @column()
  declare ipAddress: string

  @column()
  declare userAgent: string

  @column()
  declare metadata: object | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Conversion, {
    foreignKey: 'clickId',
    localKey: 'clickId',
  })
  declare conversions: HasMany<typeof Conversion>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @hasOne(() => MissingCashback, {
    foreignKey: 'clickId',
    localKey: 'clickId',
  })
  declare missingCashback: HasOne<typeof MissingCashback>
}
