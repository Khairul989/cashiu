import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'

export default class DeviceToken extends BaseModel {
  @beforeCreate()
  static setExpiredAt(deviceToken: DeviceToken) {
    deviceToken.expiredAt = DateTime.local().plus({ days: 60 })
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare token: string

  @column()
  declare info: string | null

  @column.dateTime()
  declare expiredAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
