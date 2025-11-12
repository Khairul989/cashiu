import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'
import { SMTPConfig } from '@adonisjs/mail/types'

const smtpUsername = env.get('SMTP_USERNAME', '')
const smtpPassword = env.get('SMTP_PASSWORD', '')
const smtpConfig: SMTPConfig = {
  host: env.get('MAIL_HOST'),
  port: env.get('MAIL_PORT'),
}

if (smtpUsername.length > 0 && smtpPassword.length > 0) {
  smtpConfig.auth = {
    type: 'login',
    user: smtpUsername,
    pass: smtpPassword,
  }
}

const mailConfig = defineConfig({
  default: 'smtp',

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    smtp: transports.smtp(smtpConfig),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
