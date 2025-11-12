import UserBankAccount from '#models/user_bank_account'
import User from '#models/user'
import {
  NotificationContract,
  NotificationChannelName,
  DatabaseChannelData,
  FirebaseChannelData, 
} from '@osenco/adonisjs-notifications/types'

export class UserBankAccountUpdatedNotification implements NotificationContract<User> {
  #userBankAccount: UserBankAccount
  #deviceTokens: string[] 

  /**
   * Create a new UserBankAccountUpdatedNotification instance.
   * @param userBankAccount The bank account that was updated.
   * @param deviceTokensArray An array of device tokens for Firebase notifications.
   */
  constructor(userBankAccount: UserBankAccount, deviceTokensArray: string[]) { 
    this.#userBankAccount = userBankAccount
    this.#deviceTokens = deviceTokensArray
  }

  /**
   * Get the notification channels for the user.
   * @param _notifiable The user to notify.
   * @returns An array of notification channel names.
   */
  public via(_notifiable: User): NotificationChannelName[] {
    const channels: NotificationChannelName[] = ['database']
    if (this.#deviceTokens && this.#deviceTokens.length > 0) {
      channels.push('firebase')
    }
    return channels
  }

  /**
   * Get the database representation of the notification.
   * @param notifiable The user to notify.
   * @returns The database channel data for the notification.
   */
  public toDatabase(notifiable: User): DatabaseChannelData {
    const lastFour = this.#userBankAccount.accountNumber.slice(-4)
    return {
      title: 'Bank Account Updated', 
      body: `Your bank account with ${this.#userBankAccount.bank?.bankName || 'the selected bank'} ending in ${lastFour} has been successfully updated.`, 
      data: { 
        userBankAccountId: this.#userBankAccount.id,
        userId: notifiable.id,
        type: 'user_bank_account_updated', 
      },
    }
  }

  /**
   * Get the Firebase representation of the notification.
   * @param _notifiable The user to notify.
   * @returns The Firebase channel data for the notification.
   */
  public toFirebase(_notifiable: User): FirebaseChannelData { 
    const lastFour = this.#userBankAccount.accountNumber.slice(-4)
    return {
      title: 'Bank Account Updated', 
      body: `Your bank account ending in ${lastFour} has been successfully updated.`, 
      data: { type: 'user_bank_account_updated' }, 
      analyticLabel: 'user_bank_account_updated', 
      token: this.#deviceTokens, 
    }
  }

}
