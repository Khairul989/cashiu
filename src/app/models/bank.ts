import { BaseModel, column, afterSave, afterDelete } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import redis from '@adonisjs/redis/services/main'

export default class Bank extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare bankName: string

  @column()
  declare abbreviation: string | null

  @column()
  declare swiftCode: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @afterSave()
  @afterDelete()
  public static async clearCache() {
    // Clear banks cache on Redis
    await redis.del('banks:active')
  }
}
