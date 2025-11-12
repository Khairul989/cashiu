import { defaultCommissionRate, totalCommissionRate } from '#helpers/commission_helper'
import Product from '#models/product'
import Seller from '#models/seller'
import { ShopeeGraphQL } from '#services/shopee_graphql'
import { ShopeeProductQuery } from '#types/product'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class AdminProductController {
  async index({ request, inertia }: HttpContext) {
    let search = request.input('search') as string | undefined
    const source = request.input('source', 'db') as 'db' | 'api'
    const featured = request.input('featured', null) as string | null
    const page = request.input('page', 1) as number
    const limit = request.input('limit', 25) as number
    const sortBy = request.input('sortBy', 'id') as string
    const sortOrder = request.input('sortOrder', 'desc') as 'asc' | 'desc'

    const headers = [
      { name: 'ID', value: 'id', sortable: source === 'db' },
      { name: 'Name', value: 'name', sortable: source === 'db' },
      { name: 'Seller', value: 'sellerName', sortable: false },
      { name: 'Max Cashback', value: 'cashback', sortable: source === 'db' },
      { name: 'Rating', value: 'rating', sortable: source === 'db' },
      { name: 'Sales', value: 'sales', sortable: source === 'db' },
      { name: 'Featured', value: 'featured', sortable: source === 'db' },
    ]

    let products: { data: any[]; meta: any } = { data: [], meta: [] }

    if (source === 'db') {
      const defaultCommRate = await defaultCommissionRate()

      const query = Product.query()
        .preload('seller', (query) => query.preload('platform'))
        .if(search, (query) => {
          query.where((query) => {
            query
              .whereRaw('MATCH(`name`) AGAINST(? IN BOOLEAN MODE)', [`*${search}*` as string])
              .orWhere('id', search as string)
          })
        })
        .if(featured, (query) => query.where('featured', JSON.parse(featured as string)))
        .if(sortBy, (query) =>
          query.if(
            sortBy === 'cashback',
            (query) =>
              query.orderBy(
                db.raw('(seller_commission_rate + platform_commission_rate) * price_max * ?', [
                  defaultCommRate,
                ]),
                sortOrder as 'asc' | 'desc'
              ),
            (query) => query.orderBy(sortBy, sortOrder)
          )
        )

      products = await query.paginate(page, limit).then(async (result) => {
        result.baseUrl(request.url())
        result.queryString(request.qs())

        const data = result.all().map((product) => {
          return {
            id: product.id,
            platformItemId: product.platformItemId,
            platformSellerId: product.seller?.platformSellerId,
            name: product.name,
            imageUrl: product.imageUrl,
            currency: product.currency,
            priceMin: product.priceMin,
            priceMax: product.priceMax,
            productCatIds: product.productCatIds,
            sellerCommissionRate: product.sellerCommissionRate,
            shopeeCommissionRate: product.platformCommissionRate,
            cashback: totalCommissionRate(product, defaultCommRate),
            rating: product.rating,
            sales: product.sales,
            featured: product.featured,
            sellerName: product.seller?.name,
            sellerUrl: product.seller?.sellerUrl,
            productLink: product.url,
          }
        })

        return {
          meta: result.getMeta(),
          data,
        }
      })
    } else if (search) {
      const shopeeService = new ShopeeGraphQL('shopee.com.my')
      let itemId = 0
      let isUrl = false

      try {
        new URL(search as string)
        isUrl = true
      } catch (error) {}

      if (isUrl) {
        const result = await shopeeService.getProductIdFromUrl(search as string)
        itemId = result.itemId
      }

      if (!isNaN(Number(search))) {
        itemId = Number(search)
      }

      const keyword = itemId === 0 ? search : undefined
      const payload: ShopeeProductQuery = {
        limit,
        page,
      }

      if (itemId !== 0) {
        payload.itemId = itemId
      } else if (keyword) {
        payload.keyword = keyword
      }

      const result = await shopeeService.fetchProducts(payload)

      const nodes = result.data.productOfferV2.nodes
      const pageInfo = result.data.productOfferV2.pageInfo

      // cross-reference with DB to see if product exists and get active flag
      const shopIds = nodes.map((n) => n.shopId)
      const itemIds = nodes.map((n) => n.itemId.toString())

      const sellersFromDb = await Seller.query()
        .where('platform_id', 1)
        .whereIn(
          'platformSellerId',
          shopIds.map((id: number) => id.toString())
        )
        .select('id', 'platformSellerId')

      const sellerIdByPlatformId = new Map<string, number>(
        sellersFromDb.map((s) => [s.platformSellerId, s.id])
      )

      const productsFromDb = await Product.query()
        .whereIn('platformItemId', itemIds)
        .whereIn('sellerId', Array.from(sellerIdByPlatformId.values()))
        .select('id', 'sellerId', 'platformItemId', 'featured')

      nodes.forEach((n) => {
        const sellerId = sellerIdByPlatformId.get(n.shopId.toString())
        const dbProduct = productsFromDb.find(
          (p) => p.platformItemId === n.itemId.toString() && p.sellerId === sellerId
        )

        const lastCategoryId =
          n.productCatIds
            ?.slice()
            .reverse()
            .find((id: number) => id !== 0) || 0

        products.data.push({
          id: dbProduct?.id || 0,
          platformItemId: n.itemId.toString(),
          name: n.productName,
          imageUrl: n.imageUrl,
          currency: 'RM',
          priceMin: parseFloat(n.priceMin),
          priceMax: parseFloat(n.priceMax),
          categoryId: lastCategoryId,
          categoryTree: n.productCatIds,
          sellerCommissionRate: parseFloat(n.sellerCommissionRate),
          shopeeCommissionRate: parseFloat(n.shopeeCommissionRate),
          cashback:
            (parseFloat(n.sellerCommissionRate) + parseFloat(n.shopeeCommissionRate)) *
            parseFloat(n.priceMax),
          rating: parseFloat(n.ratingStar),
          sales: n.sales,
          featured: dbProduct?.featured || false,
          sellerName: undefined,
          productLink: n.productLink,
          shopId: n.shopId,
        })
      })

      products.meta = {
        total: products.data.length,
        page: pageInfo.page,
        limit: pageInfo.limit,
        hasNextPage: pageInfo.hasNextPage,
      }
    }

    return inertia.render('admin/products/index', {
      headers,
      products,
      search,
      source,
      featured,
      page,
      limit,
      sortBy,
      sortOrder,
    })
  }

  async storeOrUpdate({ request, response }: HttpContext) {
    const products = request.input('products', []) as any[]
    const featured = request.input('featured', true) as boolean
    const shopeeService = new ShopeeGraphQL('shopee.com.my')

    for (const product of products) {
      const platformItemId = product.platformItemId || product.itemId?.toString()
      const shopId = product.platformSellerId || product.shopId

      // find seller by platform shop id
      let seller = await Seller.query()
        .where('platformId', 1)
        .where('platformSellerId', String(shopId))
        .first()

      if (!seller && product.shopId) {
        // create seller first if not exists using saveSeller via fetchShops (best-effort)
        const sellerFromApi = await shopeeService.fetchShops({
          shopId: shopId,
        })

        if (sellerFromApi.data.shopOfferV2.nodes.length > 0) {
          seller = await shopeeService.saveSeller(sellerFromApi.data.shopOfferV2.nodes[0])
        }
      }

      // find product by platform item id and seller id
      const existing = seller
        ? await Product.query()
            .where('sellerId', seller.id)
            .where('platformItemId', String(platformItemId))
            .first()
        : null

      if (existing) {
        await existing.merge({ featured }).save()
      } else {
        // save or create using Shopee API payload
        const saved = await shopeeService.saveProduct({
          itemId: Number(platformItemId),
          sellerCommissionRate: product.sellerCommissionRate?.toString() ?? '0',
          shopeeCommissionRate: product.shopeeCommissionRate?.toString() ?? '0',
          commission: product.commission?.toString() ?? '0',
          sales: Number(product.sales ?? 0),
          priceMin: product.priceMin?.toString() ?? '0',
          priceMax: product.priceMax?.toString() ?? '0',
          productCatIds: product.productCatIds ?? [],
          ratingStar: product.ratingStar?.toString() ?? product.rating?.toString() ?? '0',
          imageUrl: product.imageUrl ?? '',
          productName: product.productName ?? product.name,
          shopId: Number(shopId),
          productLink: product.productLink ?? product.url,
          priceDiscountRate: Number(product.priceDiscountRate ?? 0),
        })

        if (saved && featured) {
          await saved.merge({ featured }).save()
        }
      }
    }

    return response.created()
  }
}
