import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Product from './product.js'

export default class ProductCategory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare categoryName: string

  @column()
  declare categoryId: number

  @column()
  declare path: string // JSON representation of the full hierarchy

  @column()
  declare categoryLevel: number // Virtual column to store the category level based on the path length

  @column()
  declare imageUrls: string[] | null // List of image URLs

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Product, {
    localKey: 'categoryId',
    foreignKey: 'categoryId',
  })
  declare products: HasMany<typeof Product>
}
