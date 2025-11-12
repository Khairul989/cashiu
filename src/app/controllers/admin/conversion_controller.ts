import { numberFormat } from '#helpers/number_helper'
import ActionReason from '#models/action_reason'
import Conversion, { conversionStatuses as conversionStatusesModel } from '#models/conversion'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ConversionController {
  private headers = [
    {
      name: 'Conversion ID',
      value: 'conversionId',
      sortable: true,
    },
    {
      name: 'Order ID',
      value: 'orderId',
      sortable: false,
    },
    {
      name: 'User',
      value: 'user',
      sortable: false,
    },
    {
      name: 'Sale Amount (MYR)',
      value: 'myrSaleAmount',
      sortable: true,
    },
    {
      name: 'Cashback Payout (MYR)',
      value: 'cashbackPayout',
      sortable: true,
    },
    {
      name: 'Status',
      value: 'statusId',
      sortable: true,
    },
    {
      name: 'Conversion Date',
      value: 'datetimeConversion',
      sortable: true,
    },
    {
      name: 'Actions',
      value: 'actions',
      sortable: false,
    },
  ]

  async index({ request, inertia }: HttpContext) {
    const conversionId = request.input('conversion_id')
    const orderId = request.input('order_id')
    const status = request.input('status')
    const sortBy = request.input('sort_by', 'datetimeConversion')
    const sortOrder = request.input('sort_order', 'desc')
    const page = request.input('page', 1)
    const limit = request.input('limit', 25)

    const conversions = await this.getConversions(conversionId, orderId, status, sortBy, sortOrder)
      .paginate(page, limit)
      .then((result) => {
        result.baseUrl(request.url())
        result.queryString(request.qs())

        const data = result.all().map((conversion) => {
          return {
            id: conversion.id,
            conversionId: conversion.conversionId,
            seller: conversion.seller?.name || 'N/A',
            user: conversion.user?.name || 'N/A',
            datetimeConversion: conversion.datetimeConversion.toFormat('yyyy-MM-dd HH:mm:ss'),
            myrSaleAmount: parseFloat(conversion.myrSaleAmount.toString()),
            cashbackPayout: parseFloat(conversion.cashbackPayout.toString()),
            status: conversion.status?.value
              .replace(/_/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase()),
            checked: false as boolean,
            reason: conversion.actionReason?.reason || null,
            // Additional fields for modal
            sellerId: conversion.sellerId,
            productId: conversion.productId,
            userId: conversion.userId,
            offerId: conversion.offerId,
            orderId: conversion.orderId,
            clickId: conversion.clickId,
            category: conversion.category,
            myrPayout: parseFloat(conversion.myrPayout.toString()),
            sellerCommissionRate: parseFloat(conversion.sellerCommissionRate.toString()),
            advSubs: conversion.advSubs,
            affSubs: conversion.affSubs,
            withdrawalId: conversion.withdrawalId,
            remarks: conversion.remarks,
            createdAt: conversion.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
            updatedAt: conversion.updatedAt.toFormat('yyyy-MM-dd HH:mm:ss'),
          }
        })

        return {
          meta: result.getMeta(),
          data,
        }
      })

    // Get all conversion statuses for the filter dropdown
    const conversionStatuses = await db
      .from('master_lookups')
      .where('type', 'conversion_status')
      .where('is_active', true)
      .whereIn('value', Object.keys(conversionStatusesModel))
      .select(['id', 'value'])

    // Get all action reasons for the rejection dropdown
    const actionReasons = await ActionReason.query()
      .select('id', 'reason')
      .where('type', 'rejected_conversion')

    const stats = []

    stats.push({
      name: 'Total Conversions',
      stat: await db
        .from('conversions')
        .select(db.raw('COUNT(*) as total'))
        .then((result) => numberFormat(result[0].total, 0)),
    })
    stats.push({
      name: 'Total Sales',
      stat: await db
        .from('conversions')
        .select(db.raw('SUM(myr_sale_amount) as total'))
        .then((result) => 'MYR ' + numberFormat(result[0].total, 2)),
    })
    stats.push({
      name: 'Total Cashback',
      stat: await db
        .from('conversions')
        .select(db.raw('SUM(cashback_payout) as total'))
        .then((result) => 'MYR ' + numberFormat(result[0].total, 2)),
    })

    return inertia.render('admin/conversions/index', {
      headers: this.headers,
      conversions,
      conversionId,
      orderId,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
      conversionStatuses,
      actionReasons,
      stats,
    })
  }

  async update({ request, session, inertia }: HttpContext) {
    const { conversions, statusId, actionReasonId } = request.only([
      'conversions',
      'statusId',
      'actionReasonId',
    ])

    if (!conversions.length || !statusId) {
      session.flash('error', 'Invalid request parameters')

      return inertia.location('/admin/conversions')
    }

    try {
      await db.transaction(async (trx) => {
        const updateData: any = {
          status_id: statusId,
          updated_at: new Date(),
          action_reason_id: actionReasonId || null,
        }

        await Conversion.query({ client: trx }).whereIn('id', conversions).update(updateData)
      })

      session.flash('success', 'Conversions updated successfully')

      return inertia.location('/admin/conversions')
    } catch (error) {
      session.flash('error', 'Failed to update conversions')

      return inertia.location('/admin/conversions')
    }
  }

  private getConversions(
    conversionId: string | string[] | null,
    orderId: string | string[] | null,
    status: string | null,
    sortBy: string,
    sortOrder: string
  ) {
    let query = Conversion.query()
      .preload('seller')
      .preload('user')
      .preload('status')
      .preload('actionReason')

    if (conversionId) {
      query = query.whereIn(
        'conversion_id',
        Array.isArray(conversionId) ? conversionId : [conversionId]
      )
    }

    if (orderId) {
      query = query.whereIn('order_id', Array.isArray(orderId) ? orderId : [orderId])
    }

    if (status) {
      query = query.where('status_id', status)
    }

    // Handle sorting
    const validSortColumns = this.headers
      .filter((header) => header.sortable)
      .map((header) => header.value)
    const validSortOrders = ['asc', 'desc']

    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'datetimeConversion'
    const finalSortOrder = validSortOrders.includes(sortOrder)
      ? (sortOrder as 'asc' | 'desc')
      : 'desc'

    query = query.orderBy(finalSortBy, finalSortOrder)

    return query
  }


}
