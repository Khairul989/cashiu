import { commissionRateDecimal } from '#helpers/seller_helper'
import Seller from '#models/seller'
import env from '#start/env'
import { ApiLog } from '#types/api_logs'
import { ShopeeProduct, ShopeeProductQuery } from '#types/product'
import { ShopeeSeller, ShopeeSellerQuery } from '#types/seller'
import { FetchShopsResponse, ResponseError, SearchProductResponse } from '#types/shopee_shop'
import limiter from '@adonisjs/limiter/services/main'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'
import { createHash } from 'node:crypto'

export const shopTypes = {
  1: 'Shopee Mall',
  2: 'Shopee Preferred',
  4: 'Shopee Preferred+',
}

export class ShopeeGraphQL {
  endpoint!: string
  appId!: string
  appSecret!: string
  region!: string
  categories: { [key: string]: number } = {}

  constructor(region: string) {
    if (region.includes('my')) {
      this.endpoint = 'https://open-api.affiliate.shopee.com.my/graphql'
      this.appId = env.get('SHOPEE_MY_GRAPHQL_APP_ID') as string
      this.appSecret = env.get('SHOPEE_MY_GRAPHQL_APP_SECRET') as string
    } else {
      throw new Error('Invalid region')
    }

    this.region = region
  }

  async setCategory() {
    this.categories = await db
      .from('categories')
      .select('id', 'name')
      .whereIn('name', Object.values(shopTypes))
      .then((categories) => {
        let temp: { [key: string]: number } = {}

        categories.forEach((category) => {
          temp[category.name] = category.id
        })

        return temp
      })
  }

  async fetchShops({
    shopId = null,
    keyword = null,
    shopType = null,
    sellerCommCoveRatio = null, // ratio of products with seller commission (commission xtra) - set to null to remove filter
    isKeySeller = null, // filter for offers from Shopee's key sellers
    sortType = 1,
    limit = 50,
    page = 1,
  }: ShopeeSellerQuery): Promise<FetchShopsResponse> {
    let params = `limit: ${limit}, page: ${page}, sortType: ${sortType}`

    if (isKeySeller) {
      params += `, isKeySeller: ${isKeySeller}`
    }

    if (keyword) {
      params += `, keyword: "${keyword}"`
    }

    if (shopId) {
      params += `, shopId: ${shopId}`
    }

    if (shopType) {
      params += `, shopType: [${shopType.join(',')}]`
    }

    if (sellerCommCoveRatio) {
      params += `, sellerCommCoveRatio: "${sellerCommCoveRatio}"`
    }

    await this.setCategory()

    const query = {
      query: `{
      shopOfferV2(${params}) {
        nodes {
          shopId
          shopName
          imageUrl
          commissionRate
          ratingStar
          shopType
        }
        pageInfo {
          page
          limit
          hasNextPage
        }
      }
    }`,
      variables: null,
      operationName: null,
    }

    const payload = JSON.stringify(query)

    return (await this.runQuery(payload)) as FetchShopsResponse
  }

  async fetchProducts({
    shopId = null,
    itemId = null,
    keyword = null,
    isAMSOffer = null, // filter for products that have seller commission (commission xtra)
    isKeySeller = null,
    sortType = 1,
    limit = 50,
    page = 1,
  }: ShopeeProductQuery) {
    let params = `limit: ${limit}, page: ${page}, sortType: ${sortType}`

    if (isAMSOffer) {
      params += `, isAMSOffer: ${isAMSOffer}`
    }

    if (isKeySeller) {
      params += `, isKeySeller: ${isKeySeller}`
    }

    if (shopId) {
      params += `, shopId: ${shopId}`
    }

    if (itemId) {
      params += `, itemId: ${itemId}`
    }

    if (keyword) {
      params += `, keyword: "${keyword}"`
    }

    const query = {
      query: `{
      productOfferV2(${params}) {
        nodes {
          itemId
          sellerCommissionRate
          shopeeCommissionRate
          commission
          sales
          priceMin
          priceMax
          productCatIds
          ratingStar
          imageUrl
          productName
          shopId
          productLink
          priceDiscountRate
        }
        pageInfo {
          page
          limit
          hasNextPage
        }
      }
    }`,
      variables: null,
      operationName: null,
    }

    const payload = JSON.stringify(query)

    return (await this.runQuery(payload)) as SearchProductResponse
  }

  async saveSeller(shop: ShopeeSeller): Promise<Seller | null> {
    await this.setCategory()
    const trx = await db.transaction()

    try {
      await trx.rawQuery(
        `INSERT INTO sellers (platform_id, platform_seller_id, name, image_url, commission_rate, rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        image_url = VALUES(image_url),
        commission_rate = VALUES(commission_rate),
        rating = VALUES(rating),
        updated_at = NOW()`,
        [
          1,
          shop.shopId.toString(),
          shop.shopName,
          shop.imageUrl ?? null,
          commissionRateDecimal(shop.commissionRate),
          parseFloat(shop.ratingStar),
        ]
      )

      const seller = await Seller.query({ client: trx })
        .where('platformId', 1)
        .where('platformSellerId', shop.shopId.toString())
        .first()

      if (seller && shop.shopType.length > 0) {
        await seller.related('categories').sync(
          shop.shopType.map((type) => this.categories[shopTypes[type as keyof typeof shopTypes]]),
          true,
          trx
        )
      }

      await trx.commit()

      return seller
    } catch (error) {
      await trx.rollback()

      sentry.captureException(error)

      return null
    }
  }

  async saveProduct(product: ShopeeProduct) {
    await this.setCategory()
    const trx = await db.transaction()

    try {
      const seller = await Seller.query()
        .where('platformId', 1)
        .where('platformSellerId', product.shopId.toString())
        .first()

      if (!seller) {
        throw new Error(`Seller with ID ${product.shopId} not found`)
      }

      const savedProduct = await seller.related('products').updateOrCreate(
        { platformItemId: product.itemId.toString() },
        {
          name: product.productName,
          imageUrl: product.imageUrl ?? null,
          priceMin: parseFloat(product.priceMin),
          priceMax: parseFloat(product.priceMax),
          discountRate: product.priceDiscountRate / 100,
          categoryId:
            product.productCatIds
              ?.slice()
              .reverse()
              .find((id: number) => id !== 0) || 0,
          categoryTree: product.productCatIds,
          url: product.productLink,
          rating: parseFloat(product.ratingStar),
          platformCommissionRate: parseFloat(product.shopeeCommissionRate),
          sellerCommissionRate: parseFloat(product.sellerCommissionRate),
          sales: product.sales,
          active: true,
        },
        { client: trx }
      )

      await trx.commit()

      return savedProduct
    } catch (error) {
      await trx.rollback()

      sentry.captureException(error)

      return null
    }
  }

  async runQuery(payload: string) {
    const currentTimestamp = Math.ceil(new Date().getTime() / 1000)
    const signature = createHash('sha256')
      .update(`${this.appId}${currentTimestamp}${payload}${this.appSecret}`)
      .digest('hex')

    const uniqueKey = `shopee_graphql_${this.region}`
    const requestsLimiter = limiter.use({
      requests: 1900,
      duration: '1 hour',
      blockDuration: '5 minutes',
    })

    // for shopee rate limiter which is 2k/hour
    try {
      await requestsLimiter.consume(uniqueKey)
    } catch (error) {
      throw new Error(
        `${error.message}. Try again in ${await requestsLimiter.availableIn(uniqueKey)} seconds`
      )
    }

    return await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `SHA256 Credential=${this.appId}, Timestamp=${currentTimestamp}, Signature=${signature}`,
      },
      body: payload,
      credentials: 'include',
    })
      .then((response) => response.json())
      .then(async (data) => {
        let logs: ApiLog = {
          method: 'POST',
          url: this.endpoint,
          payload: payload,
          status: 'success',
          remarks: null,
          created_at: new Date(),
          updated_at: new Date(),
        }

        const responseError = data as ResponseError
        if (responseError.errors) {
          logs['status'] = 'error'
          logs['remarks'] = JSON.stringify(responseError.errors)

          await db.transaction(async (trx) => {
            await trx.insertQuery().table('api_logs').insert(logs)
          })

          throw new Error(responseError.errors[0].message)
        }

        await db.transaction(async (trx) => {
          await trx.insertQuery().table('api_logs').insert(logs)
        })

        return data
      })
  }

  async getProductIdFromUrl(url: string) {
    let productUrl = new URL(url as string)
    let matches: RegExpMatchArray | null = null
    let shopId: number = 0
    let itemId: number = 0

    const shortenLinkDomains = ['s.shopee.com.my', 'my.shp.ee']

    matches = productUrl.href.match(
      new RegExp(`^https:\\/\\/(?:${shortenLinkDomains.join('|')})(?:\\/.*)?$`)
    )

    if (matches) {
      const res = await fetch(productUrl.href, { redirect: 'follow' })

      if (!res.ok) {
        throw new Error('Product not found')
      }

      productUrl = new URL(res.url)
    }

    matches = productUrl.href.match(/\/opaanlp\/([^/]+\/[^/?]+)/)
    if (matches) {
      ;[shopId, itemId] = matches[1].split('/').map(Number)

      return { shopId, itemId }
    }

    matches = productUrl.href.match(/\/product\/([^/]+\/[^/?]+)/)
    if (matches) {
      ;[shopId, itemId] = matches[1].split('/').map(Number)

      return { shopId, itemId }
    }

    matches = productUrl.href.match(/i\.[0-9]+\.[0-9]+/)
    if (matches) {
      ;[shopId, itemId] = matches[0].split('.').slice(1).map(Number)

      return { shopId, itemId }
    }

    matches = productUrl.href.match(/\/offer_for_me\/(\d+)(?:[?\/]|$)/)
    if (matches) {
      itemId = Number(matches[1])

      return { shopId, itemId }
    }

    throw new Error('Product not found')
  }
}
