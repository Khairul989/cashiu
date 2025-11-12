import FirebaseChannel from '#notifications/channels/firebase'
import { channels, defineConfig } from '@osenco/adonisjs-notifications'
import type { InferChannels } from '@osenco/adonisjs-notifications/types'

const notificationConfig = defineConfig({
  channels: {
    database: channels.database({}),
    mail: channels.mail({}),
    firebase: () => new FirebaseChannel(),
  },
})

export default notificationConfig

declare module '@osenco/adonisjs-notifications/types' {
  interface NotificationChannels extends InferChannels<typeof notificationConfig> { }
  // Use this to type the database notification data
  export interface DatabaseChannelData {
    title: string
    body: string
    data?: {
      type: string
      status?: string
      [key: string]: any
    }
  }
  // Use this to type the firebase notification data
  export interface FirebaseChannelData {
    title: string
    body: string
    data?: object
    analyticLabel?: string
    imageUrl?: string
    token: string[]
  }
}
