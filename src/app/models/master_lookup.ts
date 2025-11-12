import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { conversionStatuses, defaultConversionStatus } from './conversion.js'

export default class MasterLookup extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: string

  @column()
  declare value: string

  @column()
  declare isActive: boolean

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static getMappedConversionStatus(internalStatus: string): string {
    // return key of the conversion status based on the values
    return (
      Object.keys(conversionStatuses).find((key) =>
        conversionStatuses[key as keyof typeof conversionStatuses].includes(internalStatus)
      ) || defaultConversionStatus
    )
  }
}
