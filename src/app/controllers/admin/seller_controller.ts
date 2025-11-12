import { commissionRateDisplay } from '#helpers/seller_helper'
import Seller from '#models/seller'
import { ShopeeGraphQL, shopTypes } from '#services/shopee_graphql'
import { AdminSeller, ShopeeSeller } from '#types/seller'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class SellerController {
  async index({ request, inertia }: HttpContext) {
    let search = request.input('search')
    let source = request.input('source', 'db')
    let category = request.input('category') // seller category
    let featured = request.input('featured') // seller featured status
    let product = request.input('product') // product fetch status
    let page = request.input('page', 1)
    let limit = request.input('limit', 25)
    let sortBy = request.input('sortBy', 'id')
    let sortOrder = request.input('sortOrder', 'desc') as 'asc' | 'desc'
    let sellerActiveStatus = request.input('sellerActiveStatus')
    let productActiveStatus = request.input('productActiveStatus')

    let headers = [
      {
        name: 'ID',
        value: 'id',
        sortable: source === 'db',
      },
      {
        name: 'Name',
        value: 'name',
        sortable: source === 'db',
      },
      {
        name: 'Category',
        value: 'category',
        sortable: false,
      },
      {
        name: 'Commission Rate',
        value: 'commissionRate',
        sortable: source === 'db',
      },
      {
        name: 'Total Commissionable Products',
        value: 'productsCount',
        sortable: source === 'db',
      },
      {
        name: 'Last Synced',
        value: 'lastSyncedAt',
        sortable: source === 'db',
      },
      {
        name: 'Featured',
        value: 'isFeatured',
        sortable: source === 'db',
      },
    ]

    let sellers: {
      data: AdminSeller[]
      meta: any
    } = {
      data: [],
      meta: [],
    }

    if (source === 'db') {
      const query = Seller.query()
        .preload('categories')
        .preload('platform')
        .withCount('products', (query) => {
          query.withScopes((scope) => scope.commissionable())
        })
        .if(category, (subQuery) => {
          subQuery.whereHas('categories', (builder) => {
            builder.where('categories.id', category as number)
          })
        })
        .if(search, (subQuery) => {
          subQuery.where('name', 'like', `%${search}%`)
        })
        .if(product !== undefined, (subQuery) => {
          if (JSON.parse(product)) {
            subQuery.whereNotNull('lastSyncedAt') // 'true' (Synced) -> lastSyncedAt IS NOT NULL
          } else {
            subQuery.whereNull('lastSyncedAt') // 'false' (In progress) -> lastSyncedAt IS NULL
          }
        })
        .if(featured, (subQuery) => {
          subQuery.where('isFeatured', JSON.parse(featured))
        })
        .if(sellerActiveStatus !== undefined && sellerActiveStatus !== null, (subQuery) => {
          subQuery.where('is_active', JSON.parse(sellerActiveStatus))
        })
        .if(productActiveStatus !== undefined && productActiveStatus !== null, (subQuery) => {
          if (JSON.parse(productActiveStatus)) {
            subQuery.where('active_product_count', '>', 0)
          } else {
            subQuery.where('active_product_count', '=', 0)
          }
        })

      if (sortBy) {
        let dbColumn = sortBy
        if (sortBy === 'productsCount') {
          dbColumn = 'products_count'
        } else if (sortBy === 'activeProductCount') {
          dbColumn = 'active_product_count'
        } else if (sortBy === 'lastSyncedAt') {
          dbColumn = 'last_synced_at'
        } else if (sortBy === 'commissionRate') {
          dbColumn = 'commission_rate'
        }
        query.orderBy(dbColumn, sortOrder)
      } else {
        query.orderBy('id', 'desc')
      }

      sellers = await query.paginate(page, limit).then((result) => {
        result.baseUrl(request.url())
        result.queryString(request.qs())

        const data = result.all().map((seller) => {
          return {
            id: seller.id,
            platformSellerId: seller.platformSellerId,
            name: seller.name,
            imageUrl: seller.imageUrl,
            isActive: seller.isActive,
            isFeatured: seller.isFeatured,
            activeProductCount: seller.activeProductCount,
            category: seller.categories.map((sellerCategory) => sellerCategory.name),
            commissionRate: seller.commissionRate,
            productsCount: seller.$extras.products_count,
            platformSellerUrl: seller.platform.endpoint.replace('shop_id', seller.platformSellerId),
            lastSyncedAt: seller.lastSyncedAt
              ? seller.lastSyncedAt.toFormat('yyyy-MM-dd HH:mm:ss')
              : null,
          }
        })

        return {
          meta: result.getMeta(),
          data,
        }
      })
    } else if (search) {
      let tempCategory = category
      const shopeeService = new ShopeeGraphQL('shopee.com.my')

      if (category && parseInt(category) === 3) {
        tempCategory = 4
      }

      const result = await shopeeService.fetchShops({
        keyword: search,
        shopType: tempCategory ? [tempCategory] : null,
        sellerCommCoveRatio: null, // Removed 5% commission rate filter
        sortType: 2,
        limit,
        page,
      })

      const resultData = result.data.shopOfferV2.nodes
      const resultMeta = result.data.shopOfferV2.pageInfo

      const sellersFromDb = await Seller.query()
        .withCount('products')
        .where('platform_id', 1)
        .whereIn(
          'platform_seller_id',
          resultData.map((seller) => seller.shopId)
        )
        .select(
          'id',
          'platform_seller_id',
          'is_active',
          'is_featured',
          'active_product_count',
          'last_synced_at'
        )

      resultData.map((seller) => {
        const dbSeller = sellersFromDb.find(
          (sellerFromDb) => sellerFromDb.platformSellerId === seller.shopId.toString()
        )

        sellers.data.push({
          id: dbSeller?.id || 0,
          platformSellerId: seller.shopId.toString(),
          name: seller.shopName,
          imageUrl: seller.imageUrl,
          category: [shopTypes[seller.shopType[0] as keyof typeof shopTypes]],
          commissionRate: commissionRateDisplay(seller.commissionRate),
          rating: seller.ratingStar,
          platformSellerUrl: `https://shopee.com.my/shop/${seller.shopId}`,
          isActive: dbSeller?.isActive || false,
          isFeatured: dbSeller?.isFeatured || false,
          activeProductCount: dbSeller?.activeProductCount || 0,
          productsCount: dbSeller
            ? dbSeller.lastSyncedAt
              ? dbSeller.$extras.products_count
              : 'In progress'
            : 'Unknown',
          lastSyncedAt: dbSeller?.lastSyncedAt
            ? dbSeller.lastSyncedAt.toFormat('yyyy-MM-dd HH:mm:ss')
            : null,
        })
      })

      sellers.meta = {
        total: sellers.data.length,
        page: resultMeta.page,
        limit: resultMeta.limit,
        hasNextPage: resultMeta.hasNextPage,
      }
    }

    return inertia.render('admin/sellers/index', {
      headers,
      sellers,
      search,
      source,
      category,
      product,
      featured,
      page,
      limit,
      sortBy,
      sortOrder,
      sellerActiveStatus,
      productActiveStatus,
    })
  }

  async storeOrUpdate({ request, response }: HttpContext) {
    const sellers = request.input('sellers', [])
    const isActive = request.input('isActive', false)
    const isFeatured = request.input('isFeatured', false)
    const shopeeService = new ShopeeGraphQL('shopee.com.my')

    await db.transaction(async (trx) => {
      for (const seller of sellers) {
        const shop = await Seller.query({ client: trx })
          .where('platform_id', 1)
          .where('platform_seller_id', seller.platformSellerId)
          .first()

        if (shop) {
          await shop
            .merge({
              isActive: isActive,
              isFeatured: isFeatured,
              updatedAt: DateTime.local(),
            })
            .save()
        } else {
          const savedSeller = await shopeeService.saveSeller({
            shopId: parseInt(seller.platformSellerId),
            shopName: seller.name?.trim(),
            imageUrl: seller.imageUrl,
            commissionRate: seller.commissionRate,
            ratingStar: seller.rating,
            shopType: seller.category
              ?.filter((n: any) => n)
              ?.map((category: string) =>
                parseInt(
                  Object.keys(shopTypes).find(
                    (key) => shopTypes[key as unknown as keyof typeof shopTypes] === category
                  ) ?? '0'
                )
              )
              ?.filter((n: number) => n > 0),
          } as unknown as ShopeeSeller)

          if (savedSeller) {
            await savedSeller
              .merge({
                isActive: isActive,
                isFeatured: isFeatured,
                updatedAt: DateTime.local(),
              })
              .save()
          }
        }
      }
    })

    return response.created()
  }
}
