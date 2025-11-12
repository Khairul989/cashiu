import User from '#models/user'
import UserBankAccount from '#models/user_bank_account'
import Withdrawal from '#models/withdrawal'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SyncUserBankDetails extends BaseCommand {
  static commandName = 'sync:user-bank-details'
  static description = ''

  static options: CommandOptions = { startApp: true }

  async run() {
    await Withdrawal.query()
      .whereNull('bank_id')
      .then(async (withdrawals) => {
        for (const withdrawal of withdrawals) {
          let dataMerge: Record<string, any> = {}

          const userBankAccount = await UserBankAccount.query()
            .where('user_id', withdrawal.userId)
            .first()
          if (userBankAccount) {
            dataMerge = {
              bankId: userBankAccount.bankId,
              accountHolderName: userBankAccount.accountHolderName,
              accountNumber: userBankAccount.accountNumber,
            }
          }

          const user = await User.query().where('id', withdrawal.userId).select('email').first()
          if (user) {
            dataMerge = {
              ...dataMerge,
              email: user.email,
            }
          }

          await withdrawal.merge(dataMerge).save()

          console.log(`Withdrawal ${withdrawal.id} synced`)
        }
      })
  }
}
