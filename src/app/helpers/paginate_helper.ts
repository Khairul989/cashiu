import { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DatabaseQueryBuilderContract } from '@adonisjs/lucid/types/querybuilder'

interface PaginatedResponse {
  meta: {
    perPage: number
    currentPage: number
    firstPage: number
    firstPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
  data: Record<string, any>[]
}

function appendQuery(base: string, page: number, queryString?: Record<string, any>): string {
  const params = new URLSearchParams({ ...queryString, page: String(page) })

  return `${base}?${params.toString()}`
}

export async function simplePaginate<T>(
  query: ModelQueryBuilderContract<any, T> | DatabaseQueryBuilderContract<T>,
  page: number = 1,
  perPage: number = 10,
  baseUrl: string = '/',
  queryString?: Record<string, any>,
  dataCallback?: (data: T[]) => any[]
): Promise<PaginatedResponse> {
  const offset = (page - 1) * perPage

  const results = await query.offset(offset).limit(perPage + 1)
  const hasNextPage = results.length > perPage
  const sliced = hasNextPage ? results.slice(0, perPage) : results
  const data = dataCallback ? dataCallback(sliced) : sliced

  return {
    meta: {
      perPage: sliced.length,
      currentPage: page,
      firstPage: 1,
      firstPageUrl: appendQuery(baseUrl, 1, queryString),
      nextPageUrl: hasNextPage ? appendQuery(baseUrl, page + 1, queryString) : null,
      previousPageUrl: page > 1 ? appendQuery(baseUrl, page - 1, queryString) : null,
    },
    data,
  }
}
