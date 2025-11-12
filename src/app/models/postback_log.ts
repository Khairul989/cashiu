import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Postback from './postback.js'

export default class PostbackLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare postbackId: number

  @column()
  declare url: string

  @column()
  declare method: string

  @column()
  declare headers: object | null

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => JSON.parse(value),
  })
  declare body: object | null

  @column()
  declare statusCode: number

  @column()
  declare response: object | null

  @column()
  declare remarks: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Postback)
  declare postback: BelongsTo<typeof Postback>
}
