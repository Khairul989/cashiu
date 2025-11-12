import { defaultCommissionRate, maxCommissionAmount, minCommissionAmount, totalCommissionRate, userCommissionRate } from '#helpers/commission_helper'
import { simplePaginate } from '#helpers/paginate_helper'
import Product, { lowestCommissionRate } from '#models/product'
import ProductCategory from '#models/product_category'
import Seller from '#models/seller'
import User from '#models/user'
import env from '#start/env'
import { ProductDetail } from '#types/product'
import { ShopDetail } from '#types/seller'
import { sellerIndexValidator } from '#validators/seller'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerController {
  columns = ['id', 'platformId', 'name', 'imageUrl', 'commissionRate', 'rating']

  /**
   * @index
   * @tag Sellers
   * @operationId sellerIndex
   * @summary Get sellers list
   * @paramQuery search - Search seller name - @type(string)
   * @paramQuery filter[ratingRange] - Filter sellers by rating range - @type(string)
   * @paramQuery filter[commissionRange][min] - Filter sellers by min commission - @type(number)
   * @paramQuery filter[commissionRange][max] - Filter sellers by max commission - @type(number)
   * @paramQuery featured - Filter by featured sellers - @type(boolean)
   * @paramQuery sort - Sort by rating or commission - @type(string) @enum(rating,commission)
   * @paramQuery order - Sort order - @type(string) @enum(asc,desc)
   * @paramUse(limiter)
   */
  public async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(sellerIndexValidator)

    const search = payload.search
    const ratingRange = payload.filter?.ratingRange
    const commissionRange = payload.filter?.commissionRange
    const featured = payload.featured || false
    const sort = payload.sort
    const order = payload.order
    const page = payload.page
    const limit = payload.limit

    const shopQuery = Seller.query()
      .select(this.columns)
      .preload('platform')
      .whereHas('products', (query) => {
        query.withScopes((scope) => scope.commissionable())
      })
      .if(search, (query) => query.where('name', 'like', `%${search}%`))
      .if(featured, (query) => query.where('isFeatured', true))
      .if(ratingRange, (query) => {
        query.if(
          (ratingRange as string).includes('>'),
          (query) => query.where('rating', '>=', (ratingRange as string).replace('>', '')),
          (query) => query.where('rating', ratingRange as string)
        )
      })
      .if(commissionRange, (query) => {
        query.whereBetween('commissionRate', [commissionRange?.min ?? 0, commissionRange?.max ?? 0])
      })
      .if(
        !sort,
        (query) => query.orderBy('name', 'asc'),
        (query) =>
          query.if(
            sort === 'commission',
            (query) => query.orderBy('commissionRate', order),
            (query) =>
              query.if(
                sort === 'rating',
                (query) => query.orderBy('rating', order),
                (query) => query.orderBy('createdAt', order)
              )
          )
      )

    const shops = await simplePaginate(
      shopQuery,
      page,
      limit,
      request.url(),
      request.qs(),
      (data) => {
        return data.map((seller) => {
          return {
            id: seller.id,
            name: seller.name,
            imageUrl: seller.imageUrl ?? `${env.get('APP_URL')}${seller.platform.logo}`,
            commission: seller.commissionRate,
            rating: parseFloat(seller.rating.toString()),
          }
        })
      }
    )

    return response.ok(shops)
  }

  /**
   * @homepage
   * @tag Sellers
   * @operationId sellerIndexHomepage
   * @summary Get sellers list for homepage
   */
  public async homepage({ auth, response }: HttpContext) {
    // const shopLimit = env.get('HOMEPAGE_SHOP_LIMIT', 10)
    const shopLimit = 8

    const shops: { [key: string]: Array<ShopDetail | ProductDetail | any> } = {}

    shops['Featured Stores'] = await Seller.query()
      .preload('platform')
      .where('isFeatured', true)
      .whereHas('products', (query) => {
        query.withScopes((scope) => scope.commissionable())
      })
      .select(this.columns)
      .orderByRaw('RAND()')
      .limit(shopLimit)
      .then((result) => {
        return result.map((seller) => {
          return {
            id: seller.id,
            name: seller.name,
            imageUrl: seller.imageUrl ?? `${env.get('APP_URL')}${seller.platform.logo}`,
            commission: seller.commissionRate,
            rating: parseFloat(seller.rating.toString()),
          }
        })
      })

    shops['Featured Products'] = await Product.query()
      .preload('seller', (query) => query.preload('platform'))
      .where('featured', true)
      .orderByRaw('RAND()')
      .limit(shopLimit)
      .then(async (result) => {
        const userId = auth.use('api').isAuthenticated
          ? (auth.use('api').user as User).id
          : undefined

        const userCommRate = await userCommissionRate(userId)
        const defaultCommRate = await defaultCommissionRate()

        return result.map((product) => {
          return {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl ?? `${env.get('APP_URL')}${product.seller.platform.logo}`,
            priceMin: product.priceMin,
            priceMax: product.priceMax,
            currency: product.currency,
            commissionMin: minCommissionAmount(product, userCommRate),
            commissionMax: maxCommissionAmount(product, defaultCommRate),
            commissionRate: totalCommissionRate(product, userCommRate),
            rating: product.rating,
            seller: {
              id: product.seller.id,
              name: product.seller.name,
              rating: product.seller.rating,
              imageUrl:
                product.seller.imageUrl ?? `${env.get('APP_URL')}${product.seller.platform.logo}`,
            },
          }
        })
      })

    return response.ok(shops)
  }

  /**
   * Get (Shopee) subcategories for a seller
   * @param sellerId - The ID of the seller
   * @returns A promise that resolves to an array of subcategories
   * @throws {Error} If the seller ID is invalid or if there is an error during the query
   */
  private async getSubcategoriesFromSeller(sellerId: number): Promise<any[]> {
    // 1. Query all product categories for the seller's products.
    const categories = await ProductCategory.query()
      .distinct('product_categories.*')
      .join('products', 'product_categories.category_id', 'products.category_id')
      .where('products.seller_id', sellerId)
      .where((query) => {
        query
          .where('products.price_min', '>=', 0.01 / lowestCommissionRate)
          .orWhere('products.seller_commission_rate', '>', 0)
      })
      .orderBy('product_categories.category_name', 'asc')

    // 2. Identify and collect all level 2 and level 3 categories, and their parent relationships from the path.
    const level2CategoriesSet = new Set<number>()
    const level3Categories: any[] = []
    categories.forEach((category) => {
      if (category.categoryLevel === 2) {
        level2CategoriesSet.add(category.categoryId)
      } else if (category.categoryLevel === 3) {
        const categoryPath = JSON.parse(category.path)
        const parentCategoryId = categoryPath[categoryPath.length - 2]
        level2CategoriesSet.add(parentCategoryId)
        level3Categories.push(category)
      }
    })

    // 3. Query all unique level 2 categories and build a map for quick lookup.
    const level2CategoryIds = Array.from(level2CategoriesSet)
    const level2CategoryRows = await ProductCategory.query().whereIn(
      'categoryId',
      level2CategoryIds
    )
    const level2CategoryMap = new Map<number, (typeof level2CategoryRows)[0]>()
    for (const cat of level2CategoryRows) {
      level2CategoryMap.set(cat.categoryId, cat)
    }

    // 4. Build level 2 category objects and prepare for nesting.
    const level2Categories: {
      categoryId: number
      categoryName: string
      categoryLevel: number
      subcategoryCount: number
      imageUrl?: string | null
      subcategories: {
        categoryId: number
        categoryName: string
        categoryLevel: number
        subcategoryCount: number
        imageUrl?: string | null
        subcategories: never[]
      }[]
    }[] = level2CategoryIds.map((categoryId) => {
      const category = level2CategoryMap.get(categoryId)
      return {
        categoryId: category?.categoryId || categoryId,
        categoryName: category?.categoryName || `Category ${categoryId}`,
        categoryLevel: category?.categoryLevel || 2,
        subcategoryCount: 0,
        imageUrl: category?.imageUrls ? category.imageUrls[0] : null,
        subcategories: [],
      }
    })

    // 5. Query product images for level 3 categories and map them to their respective categories.
    const firstProducts = await Product.query()
      .select('category_id', 'image_url')
      .whereIn(
        'category_id',
        level3Categories.map((category) => category.categoryId)
      )
      .andWhere('seller_id', sellerId)
      .orderBy('created_at', 'asc')
    const firstProductMap = new Map(
      firstProducts.map((product) => [product.categoryId, product.imageUrl])
    )

    // 6. Nest level 3 categories under their parent level 2 categories.
    for (const level3Category of level3Categories) {
      const categoryPath = JSON.parse(level3Category.path)
      const parentCategoryId = categoryPath[categoryPath.length - 2]
      const parentCategory = level2Categories.find(
        (category) => category.categoryId === parentCategoryId
      )
      if (parentCategory) {
        parentCategory.subcategories.push({
          categoryId: level3Category.categoryId,
          categoryName: level3Category.categoryName,
          categoryLevel: level3Category.categoryLevel,
          subcategoryCount: 0,
          imageUrl: firstProductMap.get(level3Category.categoryId) || null,
          subcategories: [],
        })
        parentCategory.subcategoryCount = parentCategory.subcategories.length
      }
    }

    // 7. Update subcategory counts for level 2 categories.
    level2Categories.forEach((category) => {
      category.subcategoryCount = category.subcategories.length
    })

    // 8. Identify all unique level 1 category IDs from the path.
    const level1CategoriesSet = new Set<number>()
    categories.forEach((category) => {
      const categoryPath = JSON.parse(category.path)
      if (categoryPath.length > 0) {
        level1CategoriesSet.add(categoryPath[0])
      }
    })

    // 9. Query all unique level 1 categories and build a map for quick lookup.
    const level1CategoryIds = Array.from(level1CategoriesSet)
    const level1CategoryRows = await ProductCategory.query().whereIn(
      'categoryId',
      level1CategoryIds
    )
    const level1CategoryMap = new Map<number, (typeof level1CategoryRows)[0]>()
    for (const cat of level1CategoryRows) {
      level1CategoryMap.set(cat.categoryId, cat)
    }

    // 10. Build the final nested structure: level 1 → level 2 → level 3, sorting by category name at each level.
    const sellerCategories = level1CategoryIds.map((level1Id) => {
      const level1 = level1CategoryMap.get(level1Id)
      // Find all level 2 categories under this level 1
      let level2s = level2Categories.filter((cat) => {
        const catRow = level2CategoryMap.get(cat.categoryId)
        if (!catRow) return false
        const catPath = JSON.parse(catRow.path)
        return catPath[0] === level1Id
      })
      // Sort level 2 categories by categoryName
      level2s = level2s.sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''))
      // Sort level 3 categories by categoryName for each level 2
      level2s.forEach((level2) => {
        level2.subcategories = level2.subcategories.sort((a, b) =>
          (a.categoryName || '').localeCompare(b.categoryName || '')
        )
      })
      return {
        categoryId: level1?.categoryId || level1Id,
        categoryName: level1?.categoryName || `Category ${level1Id}`,
        categoryLevel: level1?.categoryLevel || 1,
        subcategoryCount: level2s.length,
        imageUrl: level1?.imageUrls ? level1.imageUrls[0] : null,
        subcategories: level2s,
      }
    })

    // Sort level 1 categories by categoryName
    sellerCategories.sort(
      (a, b) =>
        b.subcategoryCount - a.subcategoryCount ||
        (a.categoryName || '').localeCompare(b.categoryName || '')
    )

    // 11. Return the nested result.
    return sellerCategories
  }

  /**
   * @show
   * @tag Sellers
   * @operationId sellerShow
   * @summary Get seller details
   */
  public async show({ params, response }: HttpContext) {
    const sellerId = params.id
    const seller = await Seller.query().preload('platform').where('id', sellerId).firstOrFail()
    const productCategories = await this.getSubcategoriesFromSeller(sellerId)

    return response.ok({
      id: seller.id,
      name: seller.name,
      imageUrl: seller.imageUrl ?? `${env.get('APP_URL')}${seller.platform.logo}`,
      rating: seller.rating,
      tnc: seller.platform.terms,
      productCategories,
    })
  }
}
