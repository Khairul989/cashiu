import PlatformOffer from '#models/platform_offer'
import Seller from '#models/seller'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Platform extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare logo: string

  @column()
  declare banner: string

  @column()
  declare validationTerm: number

  @column()
  declare paymentTerm: number

  @column()
  declare currency: string

  @column()
  declare endpoint: string

  @column()
  declare terms: string

  @column({
    consume: (value) => JSON.parse(value),
  })
  declare guidelines: string
  
  @column({
    consume: (value) => JSON.parse(value),
  })
  declare info: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Seller)
  declare sellers: HasMany<typeof Seller>

  @hasMany(() => PlatformOffer)
  declare platformOffers: HasMany<typeof PlatformOffer>

  @hasOne(() => PlatformOffer, {
    onQuery: (query) => query.where('is_primary', true),
  })
  declare primaryPlatformOffer: HasOne<typeof PlatformOffer>
}
