import { Client } from '@elastic/elasticsearch'
import Product from '#models/product'
import elasticsearchConfig from '#config/elasticsearch'

export class ElasticsearchService {
  private client: Client

  constructor(){
    this.client = new Client({
      node: elasticsearchConfig.node,
      requestTimeout: elasticsearchConfig.requestTimeout,
    })
  }


  /**
   * Stream products that need to be indexed
   * Only includes products that are either:
   * - Never indexed before (last_indexed_at is null)
   * - Updated after last indexing (updated_at > last_indexed_at)
   */
  private async* productStream(chunkSize: number = 1000){
    let offset = 0;

    while(true){
      const batch = await Product.query()
        .whereNull('lastIndexedAt')
        .orWhereRaw('updated_at > last_indexed_at')
        .orderBy('id')
        .limit(chunkSize)
        .offset(offset)

      if(batch.length === 0) break

      for(const product of batch){
        yield product
      }

      offset += chunkSize
    }
  }

  async indexProduct(product: Product) {
    await this.client.index({
      index: 'products',
      id: product.id.toString(),
      document: {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        rating: product.rating,
        sales: product.sales,
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        sellerCommissionRate: product.sellerCommissionRate,
      }
    })
  }

  /**
   * Find recommended products based on similarity to the given product
   * Returns products with:
   * - Same category
   * - Similar name (fuzzy matching)
   * - Price range within ±500
   * - Sorted by commission rate (high to low), then price (low to high)
   * - Excludes current product and its seller's products
   */
  async getRecommendedProducts(product: Product, limit: number = 5) {
    try {
      // Price range filters (±500 from current product)
      const filters: any[] = [
        {
          range: {
            priceMin: {
              gte: product.priceMin - 500,
            }
          }
        },
        {
          range: {
            priceMax: {
              lte: product.priceMax + 500
            }
          }
        }
      ]

      // Add category filter if product has one
      if (product.categoryId) {
        filters.push({
          term: {
            categoryId: product.categoryId
          }
        })
      }

      // Exclude current product
      const mustNotFilters: any[] = [
        {
          term: {
            id: product.id
          }
        }
      ]

      // Exclude products from the same seller
      if (product.sellerId) {
        mustNotFilters.push({
          term: {
            sellerId: product.sellerId
          }
        })
      }

      const searchParams: any = {
        index: 'products',
        query:{
          bool: {
            must: [
              {
                match: {
                  name: {
                    query: product.name,
                    fuzziness: 'AUTO'
                  }
                }
              }
            ],
            filter: filters,
            must_not: mustNotFilters
          }
        },
        sort: [
          { sellerCommissionRate: 'desc' },
          { priceMin: 'asc' }
        ],
        size: limit
      }

      const results = await this.client.search(searchParams)
      return results.hits.hits.map(hit => hit._source)
    } catch {
      return []
    }
  }

  /**
   * Bulk index new and updated products using Elasticsearch bulk API
   * Only indexes products that haven't been indexed or were updated since last indexing
   * Updates last_indexed_at timestamp for successfully indexed products
   */
  async bulkIndexProducts(
    batchSize: number = 1000,
    concurrency: number = 5
  ):Promise<{success:number; failed: number; errors: any[]}> {

    const errors: any[] = []
    const successfulProductIds: number[] = []

    try {
      // Use built-in bulk helper with product stream
      const result = await this.client.helpers.bulk({
        datasource: this.productStream(batchSize),
        onDocument: (product: Product) => {
          successfulProductIds.push(product.id)
          return {
            index: {
              _index: 'products',
              _id: product.id.toString()
            }
          }
        },
        onDrop: (doc) => {
          errors.push({
            id: doc.document.id,
            error: doc.error?.message || 'Unknown error'
          })
        },
        flushBytes: 5000000,
        concurrency,
        retries: 3,
        wait: 1000,
      })

      // Update last_indexed_at for successfully indexed products
      if (successfulProductIds.length > 0) {
        await Product.query()
          .whereIn('id', successfulProductIds)
          .update({ lastIndexedAt: new Date() })
      }

      return {
        success: result.successful,
        failed: result.failed,
        errors
      }
    } catch (error) {
      throw new Error(`Bulk indexing failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
