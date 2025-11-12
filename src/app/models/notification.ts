import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DatabaseChannelData } from '@osenco/adonisjs-notifications/types'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { DateTime } from 'luxon'
import User from './user.js'

export default class Notification extends compose(BaseModel, SoftDeletes) {
  static table = 'notifications'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare notifiableId: number

  @column({
    prepare: (value: DatabaseChannelData) => JSON.stringify(value),
    consume: (value: string | object): DatabaseChannelData => value as DatabaseChannelData,
  })
  declare data: DatabaseChannelData

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'notifiableId' })
  declare user: BelongsTo<typeof User>

  /**
   * Query scope to filter notifications for a specific user
   */
  static forUser = scope((query, userId: number) => {
    query.where('notifiable_id', userId)
  })

  /**
   * Query scope to filter unread notifications
   */
  static unread = scope((query) => {
    query.whereNull('read_at')
  })

  /**
   * Query scope to filter read notifications
   */
  static read = scope((query) => {
    query.whereNotNull('read_at')
  })

  /**
   * Query scope to order by newest first
   */
  static latest = scope((query) => {
    query.orderBy('created_at', 'desc')
  })

  /**
   * Query scope to filter by read status
   */
  static byReadStatus = scope((query, isRead: boolean) => {
    if (isRead) {
      query.whereNotNull('read_at')
    } else {
      query.whereNull('read_at')
    }
  })

  /**
   * Check if notification is read
   */
  get isRead(): boolean {
    return this.readAt !== null
  }

  /**
   * Get notification title from data
   */
  get title(): string {
    return this.data.title
  }

  /**
   * Get notification body from data
   */
  get body(): string {
    return this.data.body
  }

  /**
   * Get notification data payload
   */
  get notificationData(): DatabaseChannelData['data'] {
    return this.data.data
  }
}
