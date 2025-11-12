import env from '#start/env'
import sentry from '@benhepburn/adonis-sentry/service'
import {
  FirebaseChannelData,
  NotifiableModel,
  NotificationChannelContract,
} from '@osenco/adonisjs-notifications/types'
import { GoogleAuth } from 'google-auth-library'
import wrap from 'word-wrap'

export default class FirebaseChannel implements NotificationChannelContract {
  async send(data: FirebaseChannelData, _to: NotifiableModel) {
    console.debug("FirebaseChannel.send() called with data:", {
      title: data.title,
      body: data.body,
      tokenCount: data.token.length,
      hasImage: Boolean((data as any).imageUrl)
    })
    // don't send anything if there is no token
    if (data.token.length === 0) {
      console.debug("No tokens provided, skipping notification")
      return false
    }

    const clientId = env.get('FIREBASE_CLIENT_ID')
    const privateKey = env.get('FIREBASE_PRIVATE_KEY')

    if (!clientId || !privateKey) {
      sentry.captureMessage('Firebase credentials not found')
      return false
    }

    const oauthToken = await this.getOAuthToken(clientId, privateKey)

    if (!oauthToken) {
      sentry.captureMessage('Failed to get OAuth token')
      return false
    }

    const firebaseProjectId = env.get('FIREBASE_PROJECT_ID')
    const apiUrl = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`

    const payload = {
      notification: {
        title: data.title,
        body: data.body,
      },
      data: {} as { [key: string]: string },
      apns: { payload: { aps: { 'content-available': 1 } } },
      fcm_options: { analytics_label: data.analyticLabel ?? 'default' },
      token: '',
    }

    // Attach image to notification if provided (FCM supports images in notification payload)
    if ((data as any).imageUrl) {
      (payload.notification as any).image = (data as any).imageUrl
    }

    // Convert all data values to strings
    if (data.data) {
      for (const [key, value] of Object.entries(data.data)) {
        payload.data[key] = String(value);
      }
    }

    let successCount = 0
    let failCount = 0

    for (const deviceToken of data.token) {
      payload.token = deviceToken

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${oauthToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: payload }),
        });

        const responseData = await response.json() as { error?: { message: string } };

        if (responseData.error) {
          console.error(`Error sending to token ${deviceToken.substring(0, 10)}...: ${responseData.error.message}`);
          sentry.captureException(new Error(responseData.error.message));
          failCount++;
        } else {
          console.debug(`Successfully sent notification to token ${deviceToken.substring(0, 10)}...`);
          successCount++;
        }
      } catch (error) {
        console.error(`Exception sending to token ${deviceToken.substring(0, 10)}...: ${error.message}`);
        sentry.captureException(error);
        failCount++;
      }
    }

    console.debug(`Notification results: ${successCount} successful, ${failCount} failed`);
    return successCount > 0;
  }

  async getOAuthToken(clientId: string, privateKey: string) {
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

      return await client.getAccessToken()
    } catch (error) {
      sentry.captureException(error)

      return false
    }
  }
}
