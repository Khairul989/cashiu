import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import { simplePaginate } from '#helpers/paginate_helper'
import Conversion from '#models/conversion'
import Reward from '#models/reward'
import User from '#models/user'
import UserBankAccount from '#models/user_bank_account'
import Withdrawal from '#models/withdrawal'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'

export default class WithdrawalController {
  /**
   * @index
   * @tag Withdrawals
   * @operationId getWithdrawals
   * @summary Get the withdrawals history
   * @paramUse(limiter)
   */
  public async index({ request, response, auth }: HttpContext) {
    const pageNumber = Number(request.input('page', 1))
    const pageLimit = Number(request.input('limit', 10))

    const query = Withdrawal.query()
      .withScopes((scopes) => scopes.forUser(auth.user as User))
      .preload('user')
      .preload('status')
      .preload('paymentMethod')
      .preload('bank', (query) => query.select('id', 'bank_name'))
      .preload('actionReason', (query) =>
        query.select('id', 'type', 'reason', 'description', 'suggestion')
      )
      .orderBy('id', 'desc')

    const withdrawals = await simplePaginate(
      query,
      pageNumber,
      pageLimit,
      request.url(),
      request.qs(),
      (data) => {
        return data.map((withdrawal) => {
          return {
            id: withdrawal.id,
            currency: 'RM',
            amount: parseFloat(withdrawal.amount.toString()),
            status: withdrawal.status.value,
            paymentMethod: withdrawal.paymentMethod.value,
            createdAt: withdrawal.createdAt.toUTC().toISO(),
            accountHolderName: withdrawal.accountHolderName,
            bankName: withdrawal.bank ? withdrawal.bank.bankName : null,
            accountNumber: withdrawal.accountNumber,
            // email would be null, because withdrawal request does not collect email yet
            email: withdrawal.email || withdrawal.user.email, // fallback to user's email for now
            rejectedReason:
              (withdrawal.status.value === 'rejected' || withdrawal.status.value === 'failed') &&
                withdrawal.actionReason
                ? {
                  type: withdrawal.actionReason.type,
                  reason: withdrawal.actionReason.reason,
                  description: withdrawal.actionReason.description || withdrawal.remarks,
                  suggestion: withdrawal.actionReason.suggestion,
                }
                : null,
          }
        })
      }
    )

    return response.ok(withdrawals)
  }

  /**
   * @store
   * @tag Withdrawals
   * @operationId createWithdrawal
   * @summary Create a withdrawal request
   * @responseBody 201 - {"message": "Withdrawal request created successfully"}
   */
  public async store({ response, auth }: HttpContext) {
    const user = auth.user as User

    // Check for user bank account details first
    const userBankAccount = await UserBankAccount.findBy('user_id', user.id)

    if (!userBankAccount) {
      return response.unprocessableEntity({
        message: 'User bank account details not found.',
      })
    }

    const conversionStatus = await getKeyByLookUpType('conversion_status')
    const minWithdrawal = await db
      .from('settings')
      .select('value')
      .where('key', 'min_withdrawal')
      .firstOrFail()
      .then((result) => parseFloat(result.value))

    const conversions = await db
      .from((subquery) => {
        subquery
          .from('conversions')
          .select(['id', 'conversion_id', 'cashback_payout'])
          .where('user_id', user.id)
          .whereIn('status_id', [conversionStatus['paid'], conversionStatus['approved']])
          .whereNull('withdrawal_id')
          .unionAll((query) => {
            query
              .from('rewards')
              .select([
                db.raw('NULL as id'),
                db.raw('NULL as conversion_id'),
                db.raw('amount as cashback_payout'),
              ])
              .where('user_id', user.id)
              .whereIn('status_id', [conversionStatus['paid'], conversionStatus['approved']])
              .whereNull('withdrawal_id')
          })
          .as('x')
      })
      .then((result) => {
        return result.map((conversion) => {
          conversion['cashback_payout'] = parseFloat(conversion['cashback_payout'])

          return conversion
        })
      })

    const totalEarnings: number = conversions.reduce(
      (total, conversion) => total + conversion['cashback_payout'],
      0
    )

    if (totalEarnings < minWithdrawal) {
      throw new Error('Insufficient earnings to make a withdrawal request')
    }

    const withdrawalStatus = await getKeyByLookUpType('withdrawal_status')
    const paymentMethod = await getKeyByLookUpType('payment_method')

    const trx = await db.transaction()
    try {
      const withdrawal = await Withdrawal.create(
        {
          userId: user.id,
          amount: totalEarnings,
          statusId: withdrawalStatus['requested'],
          paymentMethodId: paymentMethod['bank_transfer'],
          email: userBankAccount.email || user.email,
          accountHolderName: userBankAccount.accountHolderName,
          accountNumber: userBankAccount.accountNumber,
          bankId: userBankAccount.bankId,
        },
        { client: trx }
      )

      // if conversions get too big later, move the code to use queue
      await Conversion.query({ client: trx })
        .whereIn(
          'id',
          conversions.map((conversion) => conversion.id)
        )
        .update({ withdrawal_id: withdrawal.id })

      await Reward.query({ client: trx })
        .where('user_id', user.id)
        .whereNull('withdrawal_id')
        .update({ withdrawalId: withdrawal.id })

      await trx.commit()

      await mail.sendLater((message) => {
        message
          .to(env.get('FINANCE_EMAIL_ADDRESS'))
          .subject(`${user.name} has requested a withdrawal`)
          .htmlView('emails/withdrawal_requested', {
            name: user.name,
            email: user.email,
            totalEarnings: totalEarnings.toFixed(2),
          })
      })
    } catch (error) {
      await trx.rollback()

      throw error
    }

    return response.created({ message: 'Withdrawal request created successfully' })
  }

  /**
   * @show
   * @tag Withdrawals
   * @operationId getWithdrawal
   * @summary Get withdrawal details
   * @paramUse(limiter)
   */
  public async show({ params, response, auth }: HttpContext) {
    const withdrawalId = params.id
    const user = auth.user as User

    const withdrawal = await Withdrawal.query()
      .withScopes((scopes) => scopes.forUser(user))
      .preload('status', (query) => query.select('id', 'value'))
      .preload('paymentMethod', (query) => query.select('id', 'value'))
      .preload('bank', (query) => query.select('id', 'bank_name'))
      .preload('actionReason', (query) =>
        query.select('id', 'type', 'reason', 'description', 'suggestion')
      )
      .where('id', withdrawalId)
      .firstOrFail()

    const withdrawalDetails = {
      id: withdrawal.id,
      withdrawalId: withdrawal.withdrawalId,
      currency: 'RM',
      amount: parseFloat(withdrawal.amount.toString()),
      status: withdrawal.status.value,
      paymentMethod: withdrawal.paymentMethod.value,
      createdAt: withdrawal.createdAt.toUTC().toISO(),
      accountHolderName: withdrawal.accountHolderName,
      bankName: withdrawal.bank ? withdrawal.bank.bankName : null,
      accountNumber: withdrawal.accountNumber,
      email: withdrawal.email,
      rejectedReason:
        (withdrawal.status.value === 'rejected' || withdrawal.status.value === 'failed') &&
          withdrawal.actionReason
          ? {
            type: withdrawal.actionReason.type,
            reason: withdrawal.actionReason.reason,
            description: withdrawal.actionReason.description || withdrawal.remarks,
            suggestion: withdrawal.actionReason.suggestion,
          }
          : null,
    }

    return response.ok(withdrawalDetails)
  }
}
