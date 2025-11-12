import {
  defaultCommissionRate,
  maxCommissionAmount,
  minCommissionAmount,
  totalCommissionRate,
  userCommissionRate,
} from '#helpers/commission_helper'
import { simplePaginate } from '#helpers/paginate_helper'
import { affiliateLink } from '#helpers/seller_helper'
import Product from '#models/product'
import ProductCategory from '#models/product_category'
import ProductClick from '#models/product_click'
import Seller from '#models/seller'
import User from '#models/user'
import { ElasticsearchService } from '#services/elasticsearch_service'
import { ShopeeGraphQL } from '#services/shopee_graphql'
import env from '#start/env'
import {
  activityHistoryValidator,
  productIndexValidator,
  productUrlValidator,
} from '#validators/product'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { RawQueryBindings } from '@adonisjs/lucid/types/querybuilder'
import { DateTime } from 'luxon'

export default class ProductController {
  /**
   * @index
   * @tag Products
   * @operationId productIndex
   * @summary Get a list of products
   * @paramQuery search - Search query - @type(string)
   * @paramQuery type - Product type - @type(string) @enum(all,community)
   * @paramQuery sellerId - Seller ID - @type(number)
   * @paramQuery featured - Filter by featured sellers - @type(boolean)
   * @paramQuery sort - Sort by - @type(string) @enum(sales,commission,price,created_at)
   * @paramQuery order - Sort order - @type(string) @enum(asc,desc)
   * @paramQuery random - Randomize results - @type(boolean)
   * @paramQuery pCategoryId - Product category ID - @type(number)
   * @paramUse(limiter)
   */
  async index({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(productIndexValidator)
    const search = payload.search
    const type = payload.type
    const sellerId = payload.sellerId
    const featured = payload.featured || false
    const sort = payload.sort
    const order = payload.order
    const page = payload.page
    const limit = payload.limit
    const random = payload.random
    const pCategoryId = payload.pCategoryId

    let subcategoryIds: number[] = []

    if (pCategoryId) {
      // Fetch all subcategory IDs for the given categoryId
      const parentPath = JSON.stringify([pCategoryId])

      const categories = await ProductCategory.query()
        .whereRaw('JSON_CONTAINS(path, ?)', [parentPath])
        .andWhereRaw('JSON_LENGTH(path) > JSON_LENGTH(?)', [parentPath])

      subcategoryIds = categories.map((category) => category.categoryId)
    }

    const productQuery = Product.query()
      .if(
        featured,
        (query) => query.where('featured', true),
        (query) => query.where((query) => query.withScopes((scope) => scope.commissionable()))
      )
      .if(sellerId, (query) => query.where('seller_id', sellerId as number))
      .if(pCategoryId, (query) => query.whereIn('category_id', subcategoryIds))
      .if(search, (query) => {
        query.if(
          type !== 'community',
          (query) =>
            query.whereRaw('MATCH(`name`) AGAINST(? IN BOOLEAN MODE)', [`*${search}*` as string]),
          (query) =>
            query.whereHas('referralPrograms', (query) =>
              query.where('name', 'like', search?.toLowerCase() as string)
            )
        )
      })
      .if(
        !sort,
        (query) => {
          query.if(
            random,
            (query) => {
              query
                .whereRaw(`id >= FLOOR(RAND(${random}) * (SELECT MAX(id) FROM products))`)
                .orderBy('id')
            },
            (query) => query.orderBy('created_at', 'desc')
          )
        },
        (query) => {
          query.if(
            sort === 'price',
            (query) => {
              query.if(
                order === 'asc',
                (query) => query.orderBy('priceMin', 'asc'),
                (query) => query.orderBy('priceMax', 'desc')
              )
            },
            (query) =>
              query.if(
                sort === 'commission',
                (query) => query.orderBy('sellerCommissionRate', order).orderBy('priceMax', 'desc'),
                (query) => query.orderBy(sort as string, order)
              )
          )
        }
      )

    const userId = auth.use('api').isAuthenticated ? (auth.use('api').user as User).id : undefined

    const userCommRate = await userCommissionRate(userId)
    const defaultCommRate = await defaultCommissionRate()

    const products = await simplePaginate(
      productQuery,
      page,
      limit,
      request.url(),
      Object.assign(request.qs(), { random }),
      (data) => {
        return data.map((product) => {
          return {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            currency: product.currency,
            priceMin: product.priceMin,
            priceMax: product.priceMax,
            productCatIds: product.productCatIds,
            commissionMin: minCommissionAmount(product, userCommRate),
            commissionMax: maxCommissionAmount(product, defaultCommRate),
            commissionRate: totalCommissionRate(product, userCommRate),
            rating: product.rating,
          }
        })
      }
    )

    return response.ok(products)
  }

  /**
   * @detail
   * @tag Products
   * @operationId productSearch
   * @summary Search for a product
   * @paramQuery id - Product ID (required if url is not present) - @type(number)
   * @paramQuery url - Product URL (required if id is not present) - @type(string)
   */
  async detail({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(productUrlValidator)
    const id = payload.id
    const url = payload.url

    let product: Product | null = null

    if (id) {
      product = await Product.query()
        .preload('seller', (query) => query.preload('platform'))
        .where('id', id)
        .firstOrFail()
    } else {
      const productUrl = new URL(url as string)
      const shopeeService = new ShopeeGraphQL(productUrl.hostname)
      const { shopId, itemId } = await shopeeService.getProductIdFromUrl(url as string)

      product = await Product.query()
        .preload('seller', (query) => query.preload('platform'))
        .whereHas('seller', (query) => {
          query
            .where(
              'platform_id',
              db
                .from('platforms')
                .select('id')
                .where('endpoint', 'like', `%${productUrl.hostname}%`)
            )
            .where('platform_seller_id', shopId)
        })
        .where('platform_item_id', itemId)
        .first()

      // call shopee graphql api to get product details if not found
      if (!product) {
        let searchedProducts = await shopeeService.fetchProducts({
          shopId,
          itemId,
        })

        if (searchedProducts.data.productOfferV2.nodes.length === 0) {
          return response.notFound({ message: 'Product not found' })
        }

        let seller = await Seller.query()
          .where('platformSellerId', shopId)
          .where(
            'platform_id',
            db.from('platforms').select('id').where('endpoint', 'like', `%${productUrl.hostname}%`)
          )
          .first()

        if (!seller) {
          let searchedSellers = await shopeeService.fetchShops({
            shopId,
          })

          if (searchedSellers.data.shopOfferV2.nodes.length === 0) {
            return response.notFound({ message: 'Seller not found' })
          }

          const shopeeSeller = searchedSellers.data.shopOfferV2.nodes[0]

          seller = await shopeeService.saveSeller({
            shopId: shopeeSeller.shopId,
            shopName: shopeeSeller.shopName,
            imageUrl: shopeeSeller.imageUrl,
            commissionRate: shopeeSeller.commissionRate,
            ratingStar: shopeeSeller.ratingStar,
            shopType: shopeeSeller.shopType,
          })

          if (!seller) {
            return response.notFound({ message: 'Seller not found' })
          }
        }

        const shopeeProduct = searchedProducts.data.productOfferV2.nodes[0]

        // Prepare category data
        const lastCategoryId =
          shopeeProduct.productCatIds
            ?.slice()
            .reverse()
            .find((id: number) => id !== 0) || 0

        product = await Product.create({
          sellerId: seller.id,
          platformItemId: shopeeProduct.itemId.toString(),
          name: shopeeProduct.productName,
          priceMin: parseFloat(shopeeProduct.priceMin),
          priceMax: parseFloat(shopeeProduct.priceMax),
          discountRate: shopeeProduct.priceDiscountRate / 100,
          categoryId: lastCategoryId,
          categoryTree: shopeeProduct.productCatIds,
          url: shopeeProduct.productLink,
          imageUrl: shopeeProduct.imageUrl,
          rating: parseFloat(shopeeProduct.ratingStar),
          platformCommissionRate: parseFloat(shopeeProduct.shopeeCommissionRate),
          sellerCommissionRate: parseFloat(shopeeProduct.sellerCommissionRate),
          sales: shopeeProduct.sales,
          active: true, // Product is active for seller commission (derived from isAMSOffer: true from API).
        })
      }
    }

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    await product.loadOnce('seller')
    await product.seller.loadOnce('platform')

    const userId = auth.use('api').isAuthenticated ? (auth.use('api').user as User).id : undefined

    const userCommRate = await userCommissionRate(userId)
    const defaultCommRate = await defaultCommissionRate()

    const esService = new ElasticsearchService()
    const recommendedProducts = await esService.getRecommendedProducts(product, 5)

    return response.ok({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      currency: product.currency,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      commissionMin: minCommissionAmount(product, userCommRate),
      commissionMax: maxCommissionAmount(product, defaultCommRate),
      commissionRate: totalCommissionRate(product, userCommRate),
      active: product.active,
      productLink: await affiliateLink(
        auth.use('api').user as User | undefined,
        product.seller.platform,
        product
      ),
      seller: {
        id: product.seller.id,
        name: product.seller.name,
        imageUrl: product.seller.imageUrl,
        guidelines: product.seller.platform.guidelines,
        info: product.seller.platform.info,
      },
      cashback: {
        rate: totalCommissionRate(product, userCommRate),
        tracked: env.get('CONV_TRACKED_DAYS', 2),
        payment: env.get('CONV_PAYMENT_DAYS', 14),
      },
      recommendedProducts: recommendedProducts
    })
  }

  /**
   * @click
   * @tag Products
   * @operationId productClick
   * @summary Record a click on a product
   * @paramPath id - Product ID - @type(number) @required
   */
  async click({ params, request, response, auth }: HttpContext) {
    const product = await Product.query()
      .preload('seller', (query) => query.preload('platform'))
      .where('id', params.id)
      .firstOrFail()

    await db.transaction(async (trx) => {
      const sql = db
        .table('product_clicks')
        .insert({
          product_id: product.id,
          user_id: (auth.use('api').user as User | undefined)?.id,
          affiliate_link: await affiliateLink(
            auth.use('api').user as User | undefined,
            product.seller.platform,
            product
          ),
          ip_address: request.ip(),
          created_at: DateTime.local().toString(),
          updated_at: DateTime.local().toString(),
        })
        .toSQL()

      await trx.rawQuery(
        `${sql.sql} ON DUPLICATE KEY UPDATE clicks_count=clicks_count+1, updated_at=VALUES(updated_at)`,
        sql.bindings as RawQueryBindings
      )

      await trx.rawQuery('UPDATE products SET clicks = clicks + 1 WHERE id = ?', [product.id])
    })

    return response.noContent()
  }

  /**
   * @activityHistory
   * @tag Products
   * @operationId productActivityHistory
   * @summary Get a user's product click history
   * @paramQuery page - Page number - @type(number)
   * @paramQuery limit - Limit per page - @type(number)
   */
  async activityHistory({ request, response, auth }: HttpContext) {
    const user = auth.use('api').user as User | undefined

    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const payload = await request.validateUsing(activityHistoryValidator)
    const { page, limit } = payload

    const query = ProductClick.query()
      .where('user_id', user.id)
      .preload('product', (query) => {
        query.preload('seller')
      })
      .groupByRaw('DATE(updated_at), id')
      .orderBy('updated_at', 'desc')
      .limit(100)

    const clickHistory = await simplePaginate(query, page, limit, request.url(), request.qs())
    const data = clickHistory.data.reduce<Record<string, any[]>>((acc, productClick) => {
      const formattedDate = (productClick.updatedAt || DateTime.now()).toFormat('dd MMM yyyy')

      // if date is not present in accumulator, create an array
      if (!acc[formattedDate]) {
        acc[formattedDate] = []
      }

      // push product details into the array for the specific date
      acc[formattedDate].push({
        id: productClick.productId,
        name: productClick.product.name,
        imageUrl: productClick.product.imageUrl,
        currency: productClick.product.currency,
        priceMin: productClick.product.priceMin,
        sellerName: productClick.product.seller.name,
        updatedAt: productClick.updatedAt,
      })

      return acc
    }, {})

    return response.ok({
      meta: clickHistory.meta,
      data,
    })
  }

  /**
   * @deleteAllActivityHistory
   * @tag Products
   * @operationId productDeleteAllActivityHistory
   * @summary Delete all product click history records for the authenticated user
   */
  async deleteAllActivityHistory({ response, auth }: HttpContext) {
    const user = auth.use('api').user as User | undefined

    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    await ProductClick.query().where('user_id', user.id).delete()

    return response.noContent()
  }
}
