import AccessToken from '#models/access_token'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class RefreshToken extends BaseModel {
  static table = 'oauth_refresh_tokens'
  
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare accessTokenId: string

  @column()
  declare revoked: boolean

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => AccessToken)
  declare accessToken: BelongsTo<typeof AccessToken>
}