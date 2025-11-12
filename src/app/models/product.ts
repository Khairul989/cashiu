import { commissionRateDecimal } from '#helpers/seller_helper'
import Seller from '#models/seller'
import env from '#start/env'
import { BaseModel, belongsTo, column, hasMany, manyToMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProductClick from './product_click.js'
import ReferralProgram from './referral_program.js'

export const lowestCommissionRate = env.get('NON_AMS_PRODUCT_COMMISSION_RATE', 0.0001)
export default class Product extends BaseModel {
  static commissionable = scope((query) => {
    query
      .where('priceMin', '>=', 0.01 / lowestCommissionRate)
      .orWhere('sellerCommissionRate', '>', 0)
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sellerId: number

  @column()
  declare platformItemId: string

  @column()
  declare name: string

  @column()
  declare currency: string

  @column({
    consume: (value: string) => commissionRateDecimal(value),
  })
  declare priceMin: number

  @column({
    consume: (value: string) => commissionRateDecimal(value),
  })
  declare priceMax: number

  @column()
  declare discountRate: number

  @column()
  declare categoryId: number

  @column({
    prepare: (value) => {
      JSON.stringify(value)
    },
  })
  declare categoryTree: Record<number, number> | null

  @column()
  declare url: string

  @column()
  declare imageUrl: string | null

  @column({
    prepare: (value) => commissionRateDecimal(value),
    consume: (value: string) => commissionRateDecimal(value),
  })
  declare rating: number

  @column()
  declare platformCommissionRate: number

  @column({
    consume: (value: number) =>
      // we treat non-AMS products as non-commissionable product, therefore we set a default commission rate of 0.01%
      value > 0 ? commissionRateDecimal(value) : lowestCommissionRate,
  })
  declare sellerCommissionRate: number

  @column()
  declare sales: number

  @column()
  declare productCatIds: number[] | null

  @column()
  declare clicks: number

  @column({
    consume: (value) => !!value,
  })
  declare active: boolean

  @column({
    consume: (value) => !!value,
  })
  declare featured: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare lastIndexedAt: DateTime | null

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => ProductClick)
  declare productClicks: HasMany<typeof ProductClick>

  @manyToMany(() => ReferralProgram, {
    pivotTable: 'referral_program_products',
    pivotTimestamps: true,
  })
  declare referralPrograms: ManyToMany<typeof ReferralProgram>
}
