import User from '#models/user'
import DeviceToken from '#models/device_token'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import { GoogleAuth } from 'google-auth-library'
import wrap from 'word-wrap'
import sentry from '@benhepburn/adonis-sentry/service'

export default class SendFirebaseNotification extends BaseCommand {
  static commandName = 'notification:send-firebase'
  static description = 'Send a notification to users via Firebase Cloud Messaging'

  @flags.string({
    description: 'Title of the notification',
    required: true,
  })
  declare title: string

  @flags.string({
    description: 'Body of the notification',
    required: true,
  })
  declare body: string

  @flags.string({
    description: 'User ID to send notification to (leave empty to send to all users)',
    required: false,
    flagName: 'user-id',
  })
  declare userId: string

  @flags.string({
    description: 'Additional data to send with the notification (JSON string)',
    required: false,
    flagName: 'data',
  })
  declare data: string

  @flags.string({
    description: 'Analytics label for the notification',
    default: 'admin_notification',
    flagName: 'analytic-label',
  })
  declare analyticLabel: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Sending Firebase notification')

    // Parse data if provided
    let parsedData = {}
    if (this.data) {
      try {
        parsedData = JSON.parse(this.data)
      } catch (error) {
        this.logger.error('Invalid JSON data provided')
        return
      }
    }

    // Get device tokens
    let deviceTokens: string[] = []

    if (this.userId) {
      // Send to specific user
      const user = await User.find(parseInt(this.userId))
      if (!user) {
        this.logger.error(`User with ID ${this.userId} not found`)
        return
      }

      deviceTokens = await this.getDeviceTokensForUser(parseInt(this.userId))

      if (deviceTokens.length === 0) {
        this.logger.info(`No device tokens found for user ${this.userId}`)
        return
      }

      this.logger.info(`Sending notification to user ${this.userId} (${deviceTokens.length} devices)`)
    } else {
      // Send to all users
      deviceTokens = await this.getAllDeviceTokens()

      if (deviceTokens.length === 0) {
        this.logger.info('No device tokens found')
        return
      }

      this.logger.info(`Sending notification to all users (${deviceTokens.length} devices)`)
    }

    // Send notifications
    const result = await this.sendNotifications(deviceTokens, {
      title: this.title,
      body: this.body,
      data: parsedData,
      analyticLabel: this.analyticLabel,
    })

    if (result) {
      this.logger.success('Notifications sent successfully')
    } else {
      this.logger.error('Failed to send notifications')
    }
  }

  /**
   * Get device tokens for a specific user
   */
  private async getDeviceTokensForUser(userId: number): Promise<string[]> {
    const deviceTokens = await DeviceToken.query()
      .where('user_id', userId)
      .select('token')

    return deviceTokens.map(token => token.token)
  }

  /**
   * Get all device tokens
   */
  private async getAllDeviceTokens(): Promise<string[]> {
    const deviceTokens = await DeviceToken.query()
      .select('token')

    return deviceTokens.map(token => token.token)
  }

  /**
   * Send notifications to device tokens
   */
  private async sendNotifications(
    deviceTokens: string[],
    notification: {
      title: string
      body: string
      data?: object
      analyticLabel: string
    }
  ): Promise<boolean> {
    if (deviceTokens.length === 0) {
      return false
    }

    const clientId = env.get('FIREBASE_CLIENT_ID')
    const privateKey = env.get('FIREBASE_PRIVATE_KEY')
    const firebaseProjectId = env.get('FIREBASE_PROJECT_ID')

    if (!clientId || !privateKey || !firebaseProjectId) {
      this.logger.error('Firebase credentials not found')
      return false
    }

    try {
      const oauthToken = await this.getOAuthToken(clientId, privateKey)

      if (!oauthToken) {
        this.logger.error('Failed to get OAuth token')
        return false
      }

      const apiUrl = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`

      const payload = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: Object.assign({}, notification.data),
        apns: { payload: { aps: { 'content-available': 1 } } },
        fcm_options: { analytics_label: notification.analyticLabel },
        token: '',
      }

      // Track successful and failed sends
      let successCount = 0
      let failCount = 0

      // Send to each device token
      for (const deviceToken of deviceTokens) {
        payload.token = deviceToken

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${oauthToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: payload }),
          })

          const responseData = await response.json() as any

          if (responseData && responseData.error) {
            this.logger.error(`Error sending to token ${deviceToken}: ${responseData.error.message || 'Unknown error'}`)
            failCount++
          } else {
            successCount++
          }
        } catch (error) {
          this.logger.error(`Exception sending to token ${deviceToken}: ${error.message}`)
          failCount++
        }
      }

      this.logger.info(`Notification results: ${successCount} successful, ${failCount} failed`)
      return successCount > 0
    } catch (error) {
      this.logger.error(`Error in sendNotifications: ${error.message}`)
      sentry.captureException(error)
      return false
    }
  }

  /**
   * Get OAuth token for Firebase
   */
  private async getOAuthToken(clientId: string, privateKey: string): Promise<string | false> {
    try {
      const client = new GoogleAuth({
        credentials: {
          client_email: clientId,
          private_key:
            '-----BEGIN PRIVATE KEY-----\n' +
            wrap(privateKey, { width: 64, cut: true }) +
            '\n-----END PRIVATE KEY-----\n',
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      })

      const tokenResponse = await client.getAccessToken()
      if (typeof tokenResponse === 'string') {
        return tokenResponse
      } else if (tokenResponse && typeof tokenResponse === 'object') {
        // Use type assertion to handle the token property
        const tokenObj = tokenResponse as { token?: string }
        return tokenObj.token || false
      }
      return false
    } catch (error) {
      this.logger.error(`Error getting OAuth token: ${error.message}`)
      sentry.captureException(error)
      return false
    }
  }
}
