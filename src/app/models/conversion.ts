import ActionReason from '#models/action_reason'
import MasterLookup from '#models/master_lookup'
import Product from '#models/product'
import Seller from '#models/seller'
import User from '#models/user'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { hasPermissions } from '@holoyan/adonisjs-permissions'
import { AclModelInterface } from '@holoyan/adonisjs-permissions/types'
import { MorphMap } from '@holoyan/morph-map-js'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import TrackingLink from './tracking_link.js'

export const defaultConversionStatus = 'pending'

export const conversionStatuses = {
  pending: ['pending', 'generating'],
  approved: ['approved'],
  rejected: ['rejected', 'deleted', 'failed', 'invalid'],
  paid: ['paid', 'yet to consume'],
}

@MorphMap('conversions')
export default class Conversion
  extends compose(BaseModel, Auditable, hasPermissions())
  implements AclModelInterface
{
  getModelId(): number {
    return this.id
  }

  static forUser = scope((query, user: User) => {
    query.where('user_id', user.id)
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversionId: number

  @column()
  declare sellerId: number

  @column()
  declare productId: number | null

  @column()
  declare userId: number

  @column()
  declare offerId: number

  @column()
  declare orderId: string | null

  @column()
  declare clickId: string | null

  @column()
  declare category: string | null

  @column.dateTime()
  declare datetimeConversion: DateTime

  @column()
  declare myrSaleAmount: number

  @column()
  declare myrPayout: number

  @column()
  declare sellerCommissionRate: number

  @column()
  declare cashbackPayout: number

  @column({
    prepare: (value: Record<string, string | null>) => JSON.stringify(value),
  })
  declare advSubs: Record<string, string | null>

  @column({
    prepare: (value: Record<string, string | null>) => JSON.stringify(value),
  })
  declare affSubs: Record<string, string | null>

  @column()
  declare statusId: number

  @column()
  declare actionReasonId: number | null

  @column()
  declare withdrawalId: number | null

  @column()
  declare remarks: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MasterLookup, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof MasterLookup>

  @belongsTo(() => ActionReason, {
    foreignKey: 'actionReasonId',
  })
  declare actionReason: BelongsTo<typeof ActionReason>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => TrackingLink, {
    foreignKey: 'clickId',
    localKey: 'clickId',
  })
  declare click: BelongsTo<typeof TrackingLink>
}
