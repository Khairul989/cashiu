import Withdrawal from '#models/withdrawal'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'

export default class WithdrawalStatusNotificationMail extends BaseMail {
  from = env.get('MAIL_FROM_ADDRESS')
  subject = 'Withdrawal Status Update!'
  withdrawal: Withdrawal

  constructor(withdrawal: Withdrawal) {
    super()

    this.withdrawal = withdrawal
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.withdrawal.email || this.withdrawal.user.email)
    this.message.htmlView('emails/withdrawal_status_notification', {
      withdrawal: this.withdrawal,
      bankAccountLastFour: this.withdrawal.accountNumber?.slice(-4) || '****',
      supportEmail: env.get('FEEDBACK_EMAIL_ADDRESS'),
    })
  }
}
