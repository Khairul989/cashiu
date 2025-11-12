import Client from '#models/client'
import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class AuthCode extends BaseModel {
  static table = 'oauth_auth_codes'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare clientId: string

  @column()
  declare redirect: string

  @column({
    prepare: (value: string | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare scopes: string[] | null

  @column()
  declare codeChallenge: string

  @column()
  declare codeChallengeMethod: string

  @column()
  declare revoked: boolean

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>
}