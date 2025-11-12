import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import ActionReason from '#models/action_reason'
import Conversion from '#models/conversion'
import Reward from '#models/reward'
import Withdrawal from '#models/withdrawal'
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'
import { DateTime } from 'luxon'
import * as XLSX from 'xlsx'

export default class WithdrawalController {
  async index({ request, inertia }: HttpContext) {
    const nameEmail = request.input('name_email')
    const withdrawalId = request.input('withdrawal_id')
    const status = request.input('status')
    const page = request.input('page', 1)
    const limit = request.input('limit', 25)

    const headers = [
      {
        name: 'Request Date',
        value: 'createdAt',
        sortable: false,
      },
      {
        name: 'Transaction ID',
        value: 'id',
        sortable: false,
      },
      {
        name: 'User',
        value: 'userName',
        sortable: false,
      },
      {
        name: 'Email',
        value: 'userEmail',
        sortable: false,
      },
      {
        name: 'Recipient Bank Account Name',
        value: 'recipientBankAccountName',
        sortable: false,
      },
      {
        name: 'Swift Code',
        value: 'swiftCode',
        sortable: false,
      },
      {
        name: 'Amount',
        value: 'amount',
        sortable: false,
      },
      {
        name: 'Payment Method',
        value: 'paymentMethod',
        sortable: false,
      },
      {
        name: 'Status',
        value: 'status',
        sortable: false,
      },
      {
        name: 'Updated At',
        value: 'updatedAt',
        sortable: false,
      },
    ]

    const withdrawals = await this.getWithdrawals(nameEmail, status, withdrawalId)
      .preload('actionReason')
      .paginate(page, limit)
      .then((result) => {
        result.baseUrl(request.url())
        result.queryString(request.qs())

        const data = result.all().map((withdrawal) => {
          return {
            id: withdrawal.id,
            withdrawalId: withdrawal.withdrawalId,
            userId: withdrawal.userId,
            userName: withdrawal.user.name,
            userEmail: withdrawal.email,
            recipientBankAccountName: withdrawal.accountHolderName,
            swiftCode: withdrawal.bank?.swiftCode,
            amount: parseFloat(withdrawal.amount.toString()),
            paymentMethod: withdrawal.paymentMethod.value
              .replace(/_/g, ' ') // Replace underscores with spaces
              .replace(/^\w/, (c) => c.toUpperCase()), // Capitalize first letter,
            status: withdrawal.status.value
              .replace(/_/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase()),
            statusId: withdrawal.statusId,
            remarks: withdrawal.remarks,
            createdAt: withdrawal.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
            updatedAt: withdrawal.updatedAt.toFormat('yyyy-MM-dd HH:mm:ss'),
            checked: false,
            actionReason: withdrawal.actionReason,
          }
        })

        return {
          meta: result.getMeta(),
          data,
        }
      })

    // Get all withdrawal statuses for the filter dropdown
    const withdrawalStatuses = await db
      .from('master_lookups')
      .where('type', 'withdrawal_status')
      .where('is_active', true)
      .select(['id', 'value'])

    const actionReasons = await ActionReason.query()
      .select('id', 'reason', 'type')
      .whereIn('type', ['rejected_withdrawal', 'failed_withdrawal'])

    return inertia.render('admin/withdrawals/index', {
      headers,
      withdrawals,
      nameEmail,
      withdrawalId,
      status,
      page,
      limit,
      withdrawalStatuses,
      actionReasons,
    })
  }

  async export({ request, response }: HttpContext) {
    const nameEmail = request.input('name_email')
    const withdrawalId = request.input('withdrawal_id')
    const status = request.input('status')

    // Get all withdrawals without pagination for export
    const withdrawals = await this.getWithdrawals(nameEmail, status, withdrawalId)

    // Define headers as per screenshot (two rows)
    const headers = [
      [
        'For Payment (P) -->',
        'Record Type',
        'Debit Account',
        'Payment Date\n[DD-MMM-YY]',
        'Payee Name\n[Max. 35 characters]',
        'Payee Bank Code\n[SWIFT code sheet]',
        'Payee Account',
        'Amount',
        'Email Address [Optional]\n[separated by comma for multiple email]',
        'Customer Ref.',
        'Payment Description',
        'ID Type\n[2 digits]',
        'ID No. [eg: NRIC]\n[No dash / No space]',
      ],
      [
        'For Invoice (I) -->',
        'Record Type',
        'Invoice Ref\n[Max. 12 chars]',
        'Invoice Date\n[DD-MMM-YY]',
        'Invoice Description\n[Max. 75 characters]',
        'Invoice Amount',
        '[BLANK]',
        '[BLANK]',
        '[BLANK]',
        'max 16 chars',
        'max 70 chars',
        '[BLANK]',
        '[BLANK]',
      ],
    ]

    // Convert data to array of arrays format for aoa_to_sheet
    const excelData = withdrawals
      .map((withdrawal, index) => {
        return [
          index + 1,
          'P',
          '633194633916',
          '',
          withdrawal.accountHolderName || '',
          withdrawal.bank?.swiftCode || '',
          withdrawal.accountNumber || '',
          parseFloat(withdrawal.amount.toString()),
          withdrawal.email || withdrawal.user.email,
          withdrawal.withdrawalId,
          `Withdrawal ${withdrawal.withdrawalId}`,
          '',
          '',
        ]
      })
      // filter out rows where first cell is empty
      .filter((row) => row[0] !== '')

    // Create worksheet and workbook using aoa_to_sheet
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...excelData])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Withdrawals')

    // Auto-fit columns: calculate max width for each column
    const objectMaxLength = headers[0].map((header, index) => {
      return Math.max(header.length, ...excelData.map((row) => String(row[index] ?? '').length))
    })
    worksheet['!cols'] = objectMaxLength.map((w) => ({ wch: w + 2 })) // +2 for padding

    // Generate filename with timestamp
    const timestamp = DateTime.now().toFormat('yyyy_MM_dd_HH_mm_ss')
    const filename = `withdrawals_export_${timestamp}.xlsx`

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set response headers for file download
    response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('Cache-Control', 'no-cache')
    response.header('Content-Length', excelBuffer.length.toString())

    return excelBuffer
  }

  async update({ request, inertia, session }: HttpContext) {
    const withdrawalIds = request.input('withdrawals', [])
    const statusId = request.input('statusId')
    const actionReasonId = request.input('actionReasonId')
    const remarks = request.input('remarks')

    if (!withdrawalIds.length || !statusId) {
      session.flash('error', 'Invalid request parameters')

      return inertia.location('/admin/withdrawals')
    }

    // Get the withdrawal statuses
    const withdrawalStatuses = await getKeyByLookUpType('withdrawal_status')
    const processingStatusId = withdrawalStatuses['processing']
    const rejectedStatusId = withdrawalStatuses['rejected']
    const failedStatusId = withdrawalStatuses['failed']

    // Verify that the selected withdrawals are in the 'requested' status
    const selectedWithdrawals = await Withdrawal.query()
      .whereIn('id', withdrawalIds)
      .select('id', 'status_id')

    // Filter out withdrawals that are 'failed' or 'rejected'
    const validWithdrawalIds = selectedWithdrawals
      .filter((withdrawal) =>
        [failedStatusId, rejectedStatusId].some((statusId) => statusId !== withdrawal.statusId)
      )
      .map((withdrawal) => withdrawal.id)

    if (validWithdrawalIds.length === 0) {
      session.flash('error', 'No valid withdrawals to update')

      return inertia.location('/admin/withdrawals')
    }

    const actionReason = await ActionReason.find(actionReasonId)

    const trx = await db.transaction()
    try {
      // Update all valid withdrawals
      await Withdrawal.query({ client: trx })
        .whereIn('id', validWithdrawalIds)
        .update({
          status_id: statusId,
          action_reason_id: actionReason?.id ?? null,
          remarks: remarks || null,
          updated_at: DateTime.now().toSQL({ includeOffset: false }),
        })

      // If the status is rejected or failed, set withdrawal_id to null for all related conversions, to release the amount
      if (statusId === rejectedStatusId || statusId === failedStatusId) {
        await Conversion.query({ client: trx })
          .whereIn('withdrawalId', validWithdrawalIds)
          .update({ withdrawalId: null })

        await Reward.query({ client: trx })
          .whereIn('withdrawalId', validWithdrawalIds)
          .update({ withdrawalId: null })
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()

      sentry.captureException(error)

      session.flash('error', error.message)

      return inertia.location('/admin/withdrawals')
    }

    // send notification only if the status is not processing
    if (statusId !== processingStatusId) {
      const withdrawals = await Withdrawal.query()
        .whereIn('id', validWithdrawalIds)
        .preload('user')
        .preload('bank')
        .preload('status')
        .preload('actionReason')

      // withdrawal is important to notify the user especially for email
      // therefore we will only use the notification boolean only for firebase
      // and the logic will be handled in the notification class
      for (const withdrawal of withdrawals) {
        // if the withdrawal id is not set
        if (!withdrawal.withdrawalId) {
          withdrawal.withdrawalId = Withdrawal.getWithdrawalId(withdrawal.id)
          await withdrawal.save()
        }

        emitter.emit('withdrawal:status_updated' as any, withdrawal)
      }
    }

    session.flash('success', 'Withdrawals updated successfully')

    return inertia.location('/admin/withdrawals')
  }

  private getWithdrawals(
    nameEmail: string | null,
    status: string | null,
    withdrawalId: string | null
  ) {
    return Withdrawal.query()
      .preload('user')
      .preload('status')
      .preload('paymentMethod')
      .preload('bank')
      .if(withdrawalId, (query) => {
        query.where('withdrawal_id', withdrawalId as string)
      })
      .if(nameEmail, (query) => {
        query.whereHas('user', (builder) => {
          builder.where('name', 'like', `%${nameEmail}%`).orWhere('email', 'like', `%${nameEmail}%`)
        })
      })
      .if(status, (query) => {
        query.where('status_id', status as string)
      })
      .orderBy('created_at', 'desc')
  }
}
