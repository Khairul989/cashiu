import User from '#models/user'
import {
  DatabaseChannelData,
  FirebaseChannelData,
  NotificationChannelName,
  NotificationContract,
} from '@osenco/adonisjs-notifications/types'

type AdminPayload = {
  title: string
  body: string
  data?: Record<string, any>
  analyticLabel?: string
  imageUrl?: string
}

export default class GenericAdminNotification implements NotificationContract<any> {
  #title: string
  #body: string
  #data?: Record<string, any>
  #analyticLabel: string
  #imageUrl?: string
  #deviceTokens: string[]
  #channels: NotificationChannelName[]

  constructor(
    payload: AdminPayload,
    deviceTokens: string[],
    channels: NotificationChannelName[]
  ) {
    this.#title = payload.title
    this.#body = payload.body
    this.#data = payload.data
    this.#analyticLabel = payload.analyticLabel ?? 'admin_notification'
    this.#imageUrl = payload.imageUrl
    this.#deviceTokens = deviceTokens
    this.#channels = channels
  }

  via(_notifiable: User): NotificationChannelName | NotificationChannelName[] {
    return this.#channels
  }

  public toDatabase(_notifiable: User): DatabaseChannelData {
    return {
      title: this.#title,
      body: this.#body,
      // Store data and optional imageUrl for context in the app UI
      data: Object.assign({}, this.#data ?? {}, this.#imageUrl ? { imageUrl: this.#imageUrl } : {}),
    } as unknown as DatabaseChannelData
  }

  public toFirebase(_notifiable: User): FirebaseChannelData {
    return {
      title: this.#title,
      body: this.#body,
      data: this.#data ?? {},
      analyticLabel: this.#analyticLabel,
      // Pass through optional imageUrl for Firebase channel to use
      imageUrl: this.#imageUrl,
      token: this.#deviceTokens,
    } as unknown as FirebaseChannelData
  }
}
