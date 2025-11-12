import Notification from '#models/notification'
import env from '#start/env'
import { notificationIndexValidator } from '#validators/notification'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class NotificationController {
  columns = ['id', 'notifiable_id', 'data', 'read_at', 'created_at', 'updated_at']

  private getTimeZone(): string {
    return env.get('TZ') || 'Asia/Kuala_Lumpur'
  }

  /**
   * @index
   * @tag Notifications
   * @operationId notificationIndex
   * @summary Get notifications list
   * @paramQuery page - Page number - @type(number)
   * @paramQuery limit - Items per page - @type(number)
   */
  public async index({ request, response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    const payload = await request.validateUsing(notificationIndexValidator)
    const { page, limit } = payload

    const notifications = await Notification.query()
      .select(this.columns)
      .where('notifiable_id', userId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    const zone = this.getTimeZone()

    return response.json({
      meta: notifications.getMeta(),
      data: notifications.toJSON().data.map((notification) => ({
        id: notification.id,
        title: notification.data.title,
        body: notification.data.body,
        data: notification.data,
        isRead: !!notification.readAt,
        createdAt: notification.createdAt?.setZone(zone).toISO() || null,
      })),
    })
  }

  /**
   * @show
   * @tag Notifications
   * @operationId notificationShow
   * @summary Get notification details
   */
  public async show({ params, response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    const notification = await Notification.query()
      .where('id', params.id)
      .where('notifiable_id', userId)
      .whereNull('deleted_at')
      .firstOrFail()

    const zone = this.getTimeZone()

    return response.json({
      id: notification.id,
      title: notification.data.title,
      body: notification.data.body,
      data: notification.data,
      // type: notification.data.type,
      isRead: !!notification.readAt,
      createdAt: notification.createdAt?.setZone(zone).toISO() || null,
    })
  }

  /**
   * @markAsRead
   * @tag Notifications
   * @operationId notificationMarkAsRead
   * @summary Mark notification as read
   */
  public async markAsRead({ params, response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    const notification = await Notification.query()
      .where('id', params.id)
      .where('notifiable_id', userId)
      .firstOrFail()

    notification.readAt = DateTime.now()
    await notification.save()

    return response.noContent()
  }

  /**
   * @markAllAsRead
   * @tag Notifications
   * @operationId notificationMarkAllAsRead
   * @summary Mark all notifications as read
   */
  public async markAllAsRead({ response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    await Notification.query()
      .where('notifiable_id', userId)
      .whereNull('read_at')
      .update({ read_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') })

    return response.noContent()
  }

  /**
   * @delete
   * @tag Notifications
   * @operationId notificationDelete
   * @summary Soft delete a notification by ID
   */
  public async delete({ params, response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    const notification = await Notification.query()
      .where('id', params.id)
      .where('notifiable_id', userId)
      .firstOrFail()

    await notification.delete()

    return response.noContent()
  }

  /**
   * @deleteAll
   * @tag Notifications
   * @operationId notificationDeleteAll
   * @summary Soft delete all notifications for the authenticated user
   */
  public async deleteAll({ response, auth }: HttpContext) {
    const userId = (auth.user as { id: number }).id

    await Notification.query()
      .where('notifiable_id', userId)
      .update({ deleted_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') })

    return response.noContent()
  }
}
