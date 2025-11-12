import { commissionRateDecimal, commissionRateDisplay } from '#helpers/seller_helper'
import Category from '#models/category'
import Platform from '#models/platform'
import Product from '#models/product'
import { BaseModel, belongsTo, column, computed, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Seller extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare platformId: number

  @column()
  declare platformSellerId: string

  @column()
  declare name: string

  @column()
  declare imageUrl: string | null

  @column()
  declare bannerUrl: string | null

  @column({
    prepare: (value: string) => commissionRateDecimal(value),
    consume: (value: string) => commissionRateDisplay(value),
  })
  declare commissionRate: string

  @column({
    consume: (value) => commissionRateDecimal(value),
  })
  declare rating: number

  @column({
    consume: (value) => !!value,
  })
  declare isActive: boolean

  @column({
    consume: (value) => !!value,
  })
  declare isFeatured: boolean

  @column()
  declare activeProductCount: number

  @column.dateTime()
  declare lastSyncedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed()
  get sellerUrl() {
    return this.platform.endpoint.replace('shop_id', this.platformSellerId)
  }

  @belongsTo(() => Platform)
  declare platform: BelongsTo<typeof Platform>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @manyToMany(() => Category, {
    pivotTable: 'seller_categories',
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>
}
