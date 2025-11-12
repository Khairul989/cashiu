import Conversion from '#models/conversion'
import User from '#models/user'
import {
  DatabaseChannelData,
  FirebaseChannelData,
  NotificationChannelName,
  NotificationContract,
} from '@osenco/adonisjs-notifications/types'

export default class ConversionStatusNotification implements NotificationContract<User> {
  #conversion: Conversion
  #deviceTokens: string[]

  constructor(conversion: Conversion, deviceTokens: string[]) {
    this.#conversion = conversion
    this.#deviceTokens = deviceTokens
  }

  via(_notifiable: User): NotificationChannelName | NotificationChannelName[] {
    return ['database', 'firebase']
  }

  private getStatus(): string {
    return this.#conversion.status.value.toLowerCase()
  }

  private getTitle(): string {
    const status = this.getStatus()
    
    switch (status) {
      case 'paid':
        return '🎉 Yay! You\'ve got cashback! '
      case 'rejected':
        return '💔 Uh-oh, Cashback denied!'
      case 'pending':
        return '👀 Cashback is on the way!'
      default:
        return 'Yay!'
    }
  }

  private getBody(): string {
    const status = this.getStatus()
    const sellerName = this.#conversion.seller?.name || 'this seller'
    
    switch (status) {
      case 'paid':
        const amount = parseFloat(this.#conversion.cashbackPayout.toString()).toFixed(2)
        return `RM${amount} cashback from ${sellerName} has been credited into your account!`
      case 'rejected':
        return `Oh no! Your cashback from ${sellerName} was not approved! Check details in the app.`
      case 'pending':
      default:
        return `Your cashback from ${sellerName} has been tracked and currently processing. We'll notify you once it's confirmed!`
    }
  }

  public toDatabase(_notifiable: User): DatabaseChannelData {
    return {
      title: this.getTitle(),
      body: this.getBody()
    }
  }

  public toFirebase(_notifiable: User): FirebaseChannelData {
    const data: any = {
      type: 'conversion',
      conversionId: String(this.#conversion.conversionId),
      status: this.getStatus()
    }

    // Add amount for paid status
    if (this.getStatus() === 'paid') {
      data.amount = parseFloat(this.#conversion.cashbackPayout.toString()).toFixed(2)
    }

    return {
      title: this.getTitle(),
      body: this.getBody(),
      data,
      analyticLabel: 'conversion_notification',
      token: this.#deviceTokens,
    }
  }
}
