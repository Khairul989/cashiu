import WithdrawalStatusNotificationMail from '#mails/withdrawal_status_notification'
import User from '#models/user'
import Withdrawal from '#models/withdrawal'
import {
  DatabaseChannelData,
  FirebaseChannelData,
  NotificationChannelName,
  NotificationContract,
} from '@osenco/adonisjs-notifications/types'

export default class WithdrawalStatusNotification implements NotificationContract<User> {
  #withdrawal: Withdrawal
  #deviceTokens: string[]

  constructor(withdrawal: Withdrawal, deviceTokens: string[]) {
    this.#withdrawal = withdrawal
    this.#deviceTokens = deviceTokens
  }

  via(_notifiable: User): NotificationChannelName | NotificationChannelName[] {
    return ['database', 'firebase', 'mail']
  }

  private getAmount(): string {
    return parseFloat(this.#withdrawal.amount.toString()).toFixed(2)
  }

  private getStatus(): string {
    return this.#withdrawal.status.value.toLowerCase()
  }

  private getTitle(): string {
    const status = this.getStatus()

    if (status === 'completed') {
      return '💰 Yay! Money sent!'
    } else if (status === 'rejected') {
      return '😕 Withdrawal request rejected!'
    } else if (status === 'failed') {
      return '❌ Withdrawal request failed!'
    } else {
      return 'Withdrawal Status Updated!'
    }
  }

  private getBody(): string {
    const amount = this.getAmount()
    const status = this.getStatus()

    if (status === 'completed') {
      return `RM${amount} has now been credited to your bank account ending in ****${this.#withdrawal.accountNumber?.slice(-4) || this.#withdrawal.bank}.`
    } else if (status === 'rejected') {
      return `Your withdrawal didn't go through. We have emailed you the details.`
    } else if (status === 'failed') {
      return `Your withdrawal failed to process. We have emailed you the details.`
    } else {
      return `Your withdrawal request for RM${amount} has been updated to ${status}.`
    }
  }

  public toDatabase(_notifiable: User): DatabaseChannelData {
    return {
      title: this.getTitle(),
      body: this.getBody(),
    }
  }

  public toFirebase(_notifiable: User): FirebaseChannelData {
    // If the user has disabled notifications, we will not send the notification
    if (!this.#withdrawal.user.notification) {
      this.#deviceTokens = []
    }

    return {
      title: this.getTitle(),
      body: this.getBody(),
      data: {
        type: 'withdrawal',
        withdrawalId: String(this.#withdrawal.id),
        status: this.getStatus(),
        amount: this.getAmount(),
      },
      analyticLabel: 'withdrawal_notification',
      token: this.#deviceTokens,
    }
  }

  public toMail(_notifiable: User) {
    return new WithdrawalStatusNotificationMail(this.#withdrawal)
  }
}
