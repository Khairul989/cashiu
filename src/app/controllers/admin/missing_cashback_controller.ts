import MissingCashback from '#models/missing_cashback'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class AdminMissingCashbackController {
  private headers = [
    {
      name: 'Report Date',
      value: 'createdAt',
      sortable: true,
    },
    {
      name: 'User',
      value: 'userName',
      sortable: true,
    },
    {
      name: 'Order ID',
      value: 'orderId',
      sortable: true,
    },
    {
      name: 'Status',
      value: 'statusId',
      sortable: true,
    },
    {
      name: 'Remarks',
      value: 'remarks',
      sortable: false,
    },
    {
      name: 'Updated At',
      value: 'updatedAt',
      sortable: true,
    },
    {
      name: 'Actions',
      value: 'actions',
      sortable: false,
    },
  ]

  async index({ request, inertia }: HttpContext) {
    const search = request.input('search')
    const status = request.input('status')
    const sortBy = request.input('sort_by', 'createdAt')
    const sortOrder = request.input('sort_order', 'desc')
    const page = request.input('page', 1)
    const limit = request.input('limit', 25)

    const missingCashbacks = await this.getMissingCashbacks(search, status, sortBy, sortOrder)
      .preload('status')
      .preload('user')
      .preload('trackingLink', (query) => query.preload('product'))
      .paginate(page, limit)
      .then((result) => {
        result.baseUrl(request.url())
        result.queryString(request.qs())

        const data = result.all().map((missingCashback) => {
          return {
            id: missingCashback.id,
            userId: missingCashback.userId,
            userName: missingCashback.user?.name || 'N/A',
            email: missingCashback.email || missingCashback.user?.email || 'N/A',
            clickId: missingCashback.clickId,
            orderId: missingCashback.orderId,
            status: missingCashback.status?.value
              .replace(/_/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase()),
            statusId: missingCashback.statusId,
            remarks: missingCashback.remarks,
            createdAt: missingCashback.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
            updatedAt: missingCashback.updatedAt.toFormat('yyyy-MM-dd HH:mm:ss'),
            checked: false,
            productName: missingCashback.trackingLink?.product?.name || 'N/A',
          }
        })

        return {
          meta: result.getMeta(),
          data,
        }
      })

    // Get all missing cashback statuses for the filter dropdown
    const missingCashbackStatuses = await db
      .from('master_lookups')
      .where('type', 'missing_cashback_status')
      .where('is_active', true)
      .select(['id', 'value'])

    return inertia.render('admin/missing-cashbacks/index', {
      headers: this.headers,
      missingCashbacks,
      missingCashbackStatuses,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    })
  }

  private getMissingCashbacks(
    search: string | null,
    status: string | null,
    sortBy: string,
    sortOrder: string
  ) {
    let query = MissingCashback.query()

    if (search) {
      query = query.where((subQuery) => {
        subQuery
          .whereILike('click_id', `%${search}%`)
          .orWhereILike('order_id', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereHas('user', (userQuery) => {
            userQuery.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`)
          })
      })
    }

    if (status) {
      query = query.where('status_id', status)
    }

    // Map frontend sort fields to database columns
    const sortFieldMap: Record<string, string> = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      clickId: 'click_id',
      orderId: 'order_id',
      email: 'email',
      statusId: 'status_id',
    }

    const sortField = sortFieldMap[sortBy] || 'created_at'
    query = query.orderBy(sortField, sortOrder as 'asc' | 'desc')

    return query
  }

  async updateMissingCashback({ request, inertia, auth, session }: HttpContext) {
    const missingCashbackId = request.param('id')
    const { remarks, statusId } = request.only(['remarks', 'statusId'])

    try {
      const missingCashback = await MissingCashback.query()
        .where('id', missingCashbackId)
        .firstOrFail()

      // Update remarks if provided
      if (remarks !== undefined) {
        missingCashback.remarks = remarks
      }

      // Update status if provided
      if (statusId !== undefined) {
        missingCashback.statusId = statusId
      }

      // Set updated by
      missingCashback.updatedBy = (auth.user as User).id

      await missingCashback.save()

      session.flash('success', 'Missing cashback updated successfully')
    } catch (error) {
      session.flash('error', 'Failed to update missing cashback')
    }

    return inertia.location('/admin/missing-cashbacks')
  }
}
