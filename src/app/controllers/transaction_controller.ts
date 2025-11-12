import { simplePaginate } from '#helpers/paginate_helper'
import Conversion from '#models/conversion'
import MasterLookup from '#models/master_lookup'
import Product from '#models/product'
import Reward from '#models/reward'
import User from '#models/user'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class TransactionController {
  /**
   * @index
   * @tag Transactions
   * @operationId getTransactions
   * @summary Get the transactions
   * @paramUse(limiter)
   */
  public async index({ request, response, auth }: HttpContext) {
    const pageNumber = Number(request.input('page', 1))
    const pageLimit = Number(request.input('limit', 10))

    const query = db
      .from((subquery) => {
        subquery
          .from('rewards')
          .join('master_lookups', 'rewards.status_id', 'master_lookups.id')
          .select([
            'rewards.id',
            db.raw(`'reward' as type`),
            'rewards.currency',
            db.raw('rewards.module as seller'),
            db.raw('rewards.amount as cashback'),
            db.raw('master_lookups.value as status'),
            db.raw('rewards.created_at as datetime_conversion'),
          ])
          .where('rewards.user_id', (auth.user as User).id)
          .unionAll((subquery) => {
            subquery
              .from('conversions')
              .join('sellers', 'conversions.seller_id', 'sellers.id')
              .join('master_lookups', 'conversions.status_id', 'master_lookups.id')
              .select([
                'conversions.conversion_id as id',
                db.raw(`'conversion' as type`),
                db.raw(`'RM' as currency`),
                db.raw(`sellers.name as seller`),
                db.raw(`conversions.cashback_payout as cashback`),
                db.raw(`master_lookups.value as status`),
                db.raw(`conversions.datetime_conversion as datetime_conversion`),
              ])
              .where('user_id', (auth.user as User).id)
              .where('myr_sale_amount', '>', 0)
          })
          .as('x')
      })
      .orderBy('datetime_conversion', 'desc')

    const transactions = await simplePaginate(
      query,
      pageNumber,
      pageLimit,
      request.url(),
      request.qs(),
      (data) => {
        return data.map((transaction) => {
          return {
            id: transaction.id,
            conversionId: transaction.id, // used for conversion details
            type: transaction.type,
            seller: transaction.seller,
            currency: transaction.currency,
            cashback: parseFloat(transaction.cashback.toString()),
            status: MasterLookup.getMappedConversionStatus(transaction.status),
            datetimeConversion: transaction.datetime_conversion,
          }
        })
      }
    )

    return response.ok(transactions)
  }

  /**
   * @show
   * @tag Transactions
   * @operationId getTransaction
   * @paramQuery type - Transaction type - @type(string) @enum(reward,conversion) @required
   * @summary Get transaction details
   */
  public async show({ params, request, response, auth }: HttpContext) {
    const transactionId = params.id
    const transactionType = request.input('type', 'conversion') as 'reward' | 'conversion'
    const zone = env.get('TZ') || 'Asia/Kuala_Lumpur'

    if (transactionType === 'reward') {
      const reward = await Reward.query()
        .preload('status')
        .where('user_id', (auth.user as User).id)
        .where('id', transactionId)
        .firstOrFail()

      return response.ok({
        id: reward.id,
        seller: reward.module,
        currency: reward.currency,
        cashback: reward.amount,
        status: MasterLookup.getMappedConversionStatus(reward.status.value),
        metadata: reward.metadata,
      })
    }

    const conversion = await Conversion.query()
      .withScopes((scopes) => scopes.forUser(auth.user as User))
      .preload('seller', (query) =>
        query
          .select('id', 'name', 'platform_id')
          .preload('categories')
          .preload('platform', (platformQuery) => platformQuery.select('id', 'name'))
      )
      .preload('status', (query) => query.select('id', 'value'))
      .preload('actionReason', (query) =>
        query.select('id', 'type', 'reason', 'description', 'suggestion')
      )
      .select([
        'id',
        'conversion_id',
        'seller_id',
        'product_id',
        'myr_sale_amount',
        'cashback_payout',
        'seller_commission_rate',
        'datetime_conversion',
        'status_id',
        'action_reason_id',
        'order_id',
        'category',
        'created_at',
      ])
      .where('conversion_id', transactionId)
      .firstOrFail()

    const products = await Product.query()
      .whereIn(
        'id',
        Conversion.query()
          .withScopes((scopes) => scopes.forUser(auth.user as User))
          .where('order_id', conversion.orderId as string)
          .select('product_id')
      )
      .select('id', 'name', 'image_url')

    const transaction = {
      id: conversion.id,
      conversionId: conversion.conversionId,
      seller: conversion.seller.name,
      sellerCategory: conversion.seller.categories.map((category) => category.name),
      currency: 'RM',
      amount: parseFloat(conversion.myrSaleAmount.toString()),
      cashback: parseFloat(conversion.cashbackPayout?.toString() || '0.0'),
      percentage: `${(parseFloat(conversion.sellerCommissionRate?.toString() || '0.0') * 100).toFixed(2)}%`,
      status: MasterLookup.getMappedConversionStatus(conversion.status.value),
      orderId: conversion.orderId,
      itemCategory: conversion.category,
      datetimeConversion: conversion.datetimeConversion.setZone(zone).toISO(),
      platform: conversion.seller.platform.name,
      rejectedReason:
        conversion.status.value === 'rejected' && conversion.actionReason
          ? {
              type: conversion.actionReason.type,
              reason: conversion.actionReason.reason,
              description: conversion.actionReason.description,
              suggestion: conversion.actionReason.suggestion,
            }
          : null,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
      })),
    }

    return response.ok(transaction)
  }
}
