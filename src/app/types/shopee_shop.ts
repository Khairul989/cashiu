import { ShopeeProduct } from '#types/product'
import { ShopeeSeller } from '#types/seller'

export type ResponseError = {
  errors: Array<{
    message: string
    exception: object
  }>
}

type PageInfo = {
  page: number
  limit: number
  hasNextPage: boolean
}

export type FetchShopsResponse = {
  data: {
    shopOfferV2: {
      nodes: Array<ShopeeSeller>
      pageInfo: PageInfo
    }
  }
}

export type SearchProductResponse = {
  data: {
    productOfferV2: {
      nodes: Array<ShopeeProduct>
      pageInfo: PageInfo
    }
  }
}
