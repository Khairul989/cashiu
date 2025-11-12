import Category from '#models/category'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoryController {
  /**
   * @handle
   * @tag Category
   * @operationId getCategory
   * @summary Get the category
   * @responseBody 200 - {"categories": [{"id": 1, "name": "Category 1"}, {"id": 2, "name": "Category 2"}]}
   */
  async handle({ response }: HttpContext) {
    const categories = await Category.query().select('id', 'name').orderBy('id')

    return response.ok({ categories })
  }
}
