import { simplePaginate } from '#helpers/paginate_helper'
import ProductCategory from '#models/product_category'
import {
  productCategoryGetSubcategoriesValidator,
  productCategoryIndexValidator,
} from '#validators/product_category'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductCategoryController {
  /**
   * @index
   * @tag Product Categories
   * @operationId productCategoryIndex
   * @summary Get a list of product categories
   * @paramQuery categoryLevel - Filter by category level - @type(number)
   * @paramQuery search - Search for categories by name - @type(string)
   * @paramQuery limit - Number of results per page - @type(number)
   * @paramQuery page - Page number for pagination - @type(number)
   * @paramQuery random - Random seed for ordering - @type(number)
   */
  public async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(productCategoryIndexValidator)
    const search = payload.search
    const categoryLevel = payload.categoryLevel
    const order = payload.order
    const sort = payload.sort
    const limit = payload.limit
    const page = payload.page
    const random = payload.random

    const query = ProductCategory.query()

    if (categoryLevel) {
      query.where('category_level', categoryLevel)
    }

    if (search) {
      query.where('category_name', 'like', `%${search}%`)
    }

    if (order && sort) {
      query.orderBy(sort, order)
    }

    if (random) {
      query.orderByRaw(`RAND(${random})`)
    }

    const result = await simplePaginate(query, page, limit, request.url(), request.qs(), (data) => {
      return data.map((category) => {
        return {
          categoryId: category.categoryId,
          name: category.categoryName ?? 'Category',
          imageUrl: category.categoryId
            ? // TODO: improve this by integrating with S3 bucket
              `${process.env.APP_URL}/images/product_categories/${category.categoryId}.png?v=2`
            : `${process.env.APP_URL}/images/product_categories/default.png`,
          categoryLevel: category.categoryLevel,
        }
      })
    })

    return response.ok(result)
  }

  /**
   * Get the full product category hierarchy
   */
  public async hierarchy({ response }: HttpContext) {
    const categories = await ProductCategory.query()

    const levelsCount = categories.reduce((acc: Record<number, number>, category) => {
      acc[category.categoryLevel] = (acc[category.categoryLevel] || 0) + 1
      return acc
    }, {})

    const buildHierarchy = (parentId: number | null): any[] => {
      return categories
        .filter((category) => {
          const categoryPath = JSON.parse(category.path)
          return parentId === null
            ? categoryPath.length === 1
            : categoryPath[categoryPath.length - 2] === parentId
        })
        .map((category) => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          categoryLevel: category.categoryLevel,
          subcategoryCount: 0,
          subcategories: buildHierarchy(category.categoryId),
        }))
        .map((category) => {
          category.subcategoryCount = category.subcategories.length
          return category
        })
    }

    return response.ok({
      levelsCount,
      productCategories: buildHierarchy(null),
    })
  }

  /**
   * Get subcategories from a parent category
   */
  public async subcategories({ request, response }: HttpContext) {
    const payload = await request.validateUsing(productCategoryGetSubcategoriesValidator)
    const parentCategoryId = Number(payload.categoryId)
    const parentPath = JSON.stringify([parentCategoryId])
    const categories = await ProductCategory.query()
      .whereRaw('JSON_CONTAINS(path, ?)', [parentPath])
      .andWhereRaw('JSON_LENGTH(path) > JSON_LENGTH(?)', [parentPath])

    const buildSubcategories = (parentId: number): any[] => {
      return categories
        .filter((category) => {
          const categoryPath = JSON.parse(category.path)
          return categoryPath[categoryPath.length - 2] === parentId
        })
        .map((category) => {
          const subcategories = buildSubcategories(category.categoryId)
          return {
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            categoryLevel: category.categoryLevel,
            subcategoryCount: subcategories.length,
            subcategories,
          }
        })
    }

    const parentCategory = await ProductCategory.findBy('categoryId', parentCategoryId)
    const subcategories = buildSubcategories(parentCategoryId)

    if (subcategories.length === 0) {
      return response.ok(null)
    }

    return response.ok({
      categoryId: parentCategory?.categoryId || null,
      categoryName: parentCategory?.categoryName || null,
      categoryLevel: parentCategory?.categoryLevel || null,
      subcategoryCount: subcategories.length,
      subcategories,
    })
  }
}
