import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Product from './product.js'

export default class ReferralProgram extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare appRate: number

  @column()
  declare userRate: number

  @column()
  declare referralRate: number

  @column()
  declare isCommunity: boolean

  @column({
    prepare: (value: Record<string, any>) => JSON.stringify(value),
  })
  declare config: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @manyToMany(() => Product, {
    pivotTable: 'referral_program_products',
    pivotTimestamps: true,
  })
  declare products: ManyToMany<typeof Product>
}
