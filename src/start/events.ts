import DeviceToken from '#models/device_token'
import User from '#models/user'
import UserBankAccount from '#models/user_bank_account'
import Withdrawal from '#models/withdrawal'
import { UserBankAccountAddedNotification } from '#notifications/user_bank_account_added_notification'
import { UserBankAccountUpdatedNotification } from '#notifications/user_bank_account_updated_notification'
import WithdrawalStatusNotification from '#notifications/withdrawal_status_notification'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

emitter.on('session_auth:login_succeeded', async (event) => {
  await db.transaction(async (trx) => {
    const user = event.user as User

    user.useTransaction(trx)
    user.lastLoginAt = DateTime.local()

    await user.saveQuietly()
  })
})

// Send notification when bank account is added
emitter.on('user_bank_account:created' as any, async (userBankAccount: UserBankAccount) => {
  // Get user's active device tokens
  const deviceTokensQuery = await DeviceToken.query()
    .where('user_id', userBankAccount.userId)
    .where('expired_at', '>', DateTime.now().toSQL())
    .select('token')

  const deviceTokens = deviceTokensQuery.map((dt) => dt.token)

  // Load the user and bank relationship
  await userBankAccount.load('user')
  await userBankAccount.load('bank')

  // Send notification
  await userBankAccount.user.notify(
    new UserBankAccountAddedNotification(userBankAccount, deviceTokens)
  )

  // Send email notification to user
  await mail.sendLater((message) => {
    message
      .to(userBankAccount.user.email)
      .subject('Bank Account Added Successfully')
      .htmlView('emails/user_bank_account_added', {
        user: userBankAccount.user,
        bankName: userBankAccount.bank.bankName,
        accountNumberLastFour: userBankAccount.accountNumber.slice(-4),
      })
  })
})

// Send notification when bank account is updated
emitter.on('user_bank_account:updated' as any, async (userBankAccount: UserBankAccount) => {
  // Get user's active device tokens
  const deviceTokensQuery = await DeviceToken.query()
    .where('user_id', userBankAccount.userId)
    .where('expired_at', '>', DateTime.now().toSQL())
    .select('token')

  const deviceTokens = deviceTokensQuery.map((dt) => dt.token)

  // Load the user and bank relationship
  await userBankAccount.load('user')
  await userBankAccount.load('bank')

  // Send notification
  await userBankAccount.user.notify(
    new UserBankAccountUpdatedNotification(userBankAccount, deviceTokens)
  )

  // Send email notification to user
  await mail.sendLater((message) => {
    message
      .to(userBankAccount.user.email)
      .subject('Bank Account Updated Successfully')
      .htmlView('emails/user_bank_account_updated', {
        user: userBankAccount.user,
        bankName: userBankAccount.bank.bankName,
        accountNumberLastFour: userBankAccount.accountNumber.slice(-4),
      })
  })
})

emitter.on('withdrawal:status_updated' as any, async (withdrawal: Withdrawal) => {
  const deviceTokens = await DeviceToken.query()
    .where('user_id', withdrawal.userId)
    .select('token')
    .then((tokens) => tokens.map((token) => token.token))

  const notification = new WithdrawalStatusNotification(withdrawal, deviceTokens)

  await withdrawal.user.notifyLater(notification)
})
