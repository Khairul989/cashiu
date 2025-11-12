import Conversion from '#models/conversion'
import ConversionStatusNotification from '#notifications/conversion_status_notification'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'

export default class NotifyConversionUser {
  async handle(conversion: Conversion): Promise<void> {
    await conversion.loadOnce('user')
    await conversion.loadOnce('seller')
    await conversion.loadOnce('status')

    // don't send notification if user has disabled it
    if (!conversion.user || !conversion.user.notification) {
      return
    }

    const deviceTokensArray = await db
      .from('device_tokens')
      .select('token')
      .where('user_id', conversion.userId)
      .then((deviceTokens) => {
        return deviceTokens.map((deviceToken) => deviceToken.token)
      })
      .catch((error) => {
        sentry.captureException(error)

        return []
      })

    // Send notification for conversion status changes
    const status = conversion.status.value.toLowerCase()

    // Only send notifications for specific statuses
    if (['pending', 'rejected', 'paid'].includes(status)) {
      const notification = new ConversionStatusNotification(conversion, deviceTokensArray)

      await conversion.user.notifyLater(notification)
    }
  }
}
