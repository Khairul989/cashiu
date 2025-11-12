import Client from '#models/client'
import RefreshToken from '#models/refresh_token'
import User from '#models/user'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class AccessToken extends BaseModel {
  static table = 'oauth_access_tokens'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare clientId: string

  @column()
  declare name: string | null

  @column({
    prepare: (value: string | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare scopes: string[] | null

  @column()
  declare revoked: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @hasOne(() => RefreshToken, {
    foreignKey: 'id',
  })
  declare refreshToken: HasOne<typeof RefreshToken>
}
