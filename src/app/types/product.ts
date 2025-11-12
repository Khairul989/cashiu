import { ShopDetail } from '#types/seller'

export type ProductDetail = {
  id: number
  name: string
  imageUrl: string
  currency: string
  priceMin: number
  priceMax: number
  commissionMin: number
  commissionMax: number
  commissionRate: number
  rating: number
  productLink?: string
  seller?: ShopDetail | null
}

export type ShopeeProduct = {
  itemId: number
  sellerCommissionRate: string
  shopeeCommissionRate: string
  commission: string
  sales: number
  priceMin: string
  priceMax: string
  productCatIds: number[]
  ratingStar: string
  imageUrl: string
  productName: string
  shopId: number
  productLink: string
  priceDiscountRate: number
}

export type ShopeeProductQuery = {
  shopId?: number | null
  itemId?: number | null
  productCatId?: number | null
  listType?: string | null
  matchId?: number | null
  keyword?: string | null
  isAMSOffer?: boolean | null
  isKeySeller?: boolean | null
  sortType?: number
  limit?: number
  page?: number
}
