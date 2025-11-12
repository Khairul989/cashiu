import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import User from '#models/user'
import { conversionEarnings } from '#types/conversion'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class EarningController {
  /**
   * @index
   * @tag Earnings
   * @operationId getEarnings
   * @summary Get the earnings
   * @responseBody 200 - {"minWithdrawal": 20, "availableToWithdraw": 80.32, "totalEarnings": 150.92, "pendingPayment": 32.43, "withdrawn": 1239.23, "currency": "MYR"}
   */
  public async index({ response, auth }: HttpContext) {
    const user = auth.user as User

    const minWithdrawal: { value: string } = await db
      .from('settings')
      .select('value')
      .where('key', 'min_withdrawal')
      .firstOrFail()

    const conversionStatus = await getKeyByLookUpType('conversion_status')
    const withdrawalStatus = await getKeyByLookUpType('withdrawal_status')

    const conversionQuery = db
      .from((subquery) => {
        subquery
          .from('conversions')
          .select(['cashback_payout', 'status_id', 'withdrawal_id'])
          .where('user_id', user.id)
          .unionAll((query) => {
            query
              .from('rewards')
              .select([
                db.raw('amount as cashback_payout'),
                'status_id',
                'withdrawal_id',
              ])
              .where('user_id', user.id)
          })
          .as('x')
      })
      .select(db.raw('COALESCE(SUM(cashback_payout), 0.00) as earnings'))

    // Total earnings from conversions
    const totalEarnings: conversionEarnings = await conversionQuery
      .clone()
      .whereIn('status_id', [
        conversionStatus['pending'],
        conversionStatus['approved'],
        conversionStatus['paid'],
      ])
      .first()

    // paid and approved conversions that have not been withdrawn
    const availableToWithdraw: conversionEarnings = await conversionQuery
      .clone()
      .whereIn('status_id', [conversionStatus['paid'], conversionStatus['approved']])
      .whereNull('withdrawal_id')
      .first()

    // Pending payment from approved conversions [NOT USED FOR NOW]
    const pendingPayment: conversionEarnings = await conversionQuery
      .clone()
      .where('status_id', conversionStatus['approved'])
      .first()

    // Total withdrawn amount
    const withdrawn = await db
      .from('withdrawals')
      .select(db.raw('COALESCE(SUM(amount), 0.00) as amount'))
      .where('user_id', user.id)
      .where('status_id', withdrawalStatus['completed'])
      .first()

    // Check if there are any pending withdrawals
    const hasPendingWithdrawals = await db
      .from('withdrawals')
      .where('user_id', user.id)
      .where('status_id', withdrawalStatus['requested'])
      .first()
      .then((result) => !!result)

    return response.ok({
      minWithdrawal: parseFloat(minWithdrawal.value),
      availableToWithdraw: parseFloat(availableToWithdraw.earnings),
      totalEarnings: parseFloat(totalEarnings.earnings),
      pendingPayment: parseFloat(pendingPayment.earnings),
      withdrawn: parseFloat(withdrawn.amount),
      currency: 'RM',
      hasPendingWithdrawals,
      email: user.email,
    })
  }
}
