export type ShopDetail = {
  id: number
  name: string
  imageUrl: string
  commission?: string
  rating: number
  tnc?: string
}

export type AdminSeller = {
  id: number
  platformSellerId: string
  name: string
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  category: string[]
  productsCount?: number
  activeProductCount?: number
  commissionRate?: string
  rating?: string
  checked?: boolean
  platformSellerUrl?: string
  lastSyncedAt?: string | null 
}

export type ShopeeSeller = {
  shopId: number
  shopName: string
  imageUrl: string
  commissionRate: string
  ratingStar: string
  shopType: Array<number>
}

export type ShopeeSellerQuery = {
  keyword?: string | null
  shopId?: number | null
  shopType?: Array<number> | null
  sellerCommCoveRatio?: number | null
  sortType?: number
  isKeySeller?: boolean | null
  limit?: number
  page?: number
}
