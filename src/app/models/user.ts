import { generateRandomString } from '#helpers/url_helper'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, beforeCreate, beforeSave, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { hasPermissions } from '@holoyan/adonisjs-permissions'
import { AclModelInterface } from '@holoyan/adonisjs-permissions/types'
import { MorphMap } from '@holoyan/morph-map-js'
import Notifiable from '@osenco/adonisjs-notifications/mixins/notifiable'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import DeviceToken from './device_token.js'
import ProductClick from './product_click.js'
import SocialAccount from './social_account.js'
import UserBankAccount from './user_bank_account.js'
import UserReferral from './user_referral.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

@MorphMap('users')
export default class User
  extends compose(BaseModel, AuthFinder, Auditable, Notifiable('notifications'), hasPermissions())
  implements AclModelInterface
{
  getModelId(): number {
    return this.id
  }

  @beforeCreate()
  static assignUuid(user: User) {
    user.uniqueId = randomBytes(16).toString('hex')
  }

  @beforeCreate()
  static assignApiKey(user: User) {
    user.apiKey = randomBytes(32).toString('hex')
  }

  @beforeSave()
  static assignReferralCode(user: User) {
    if (!user.referralCode) {
      user.referralCode = (user.source || 'CSHIU').toUpperCase() + generateRandomString()
    }
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uniqueId: string

  @column()
  declare name: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column({
    serialize: (value) => Boolean(value),
  })
  declare isAdmin: boolean

  @column()
  declare avatar: string | null

  @column()
  declare apiKey: string

  @column()
  declare referralCode: string | null

  @column()
  declare source: string | null

  @column({
    serialize: (value) => Boolean(value),
  })
  declare notification: boolean

  @column.dateTime()
  declare convertedAt: DateTime | null

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasOne(() => SocialAccount)
  declare socialAccount: HasOne<typeof SocialAccount>

  @hasMany(() => SocialAccount)
  declare socialAccounts: HasMany<typeof SocialAccount>

  @hasMany(() => DeviceToken)
  declare deviceTokens: HasMany<typeof DeviceToken>

  @hasOne(() => UserBankAccount)
  declare userBankAccount: HasOne<typeof UserBankAccount>

  @hasMany(() => ProductClick)
  declare productClicks: HasMany<typeof ProductClick>

  @hasOne(() => UserReferral)
  declare userReferral: HasOne<typeof UserReferral>

  @hasMany(() => UserReferral, {
    foreignKey: 'uplineUserId',
    localKey: 'id',
  })
  declare downlineUsers: HasMany<typeof UserReferral>
}
