import { ShopeeGraphQL } from '#services/shopee_graphql'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'
import { DateTime } from 'luxon'

export default class SyncShopeeProducts extends BaseCommand {
  static commandName = 'sync:shopee-products'
  static description = 'Import/Delete Shopee products based on sellers published by admin'

  @flags.string({ default: 'my' })
  declare region: string

  @flags.string({ required: false })
  declare type: string | undefined

  @flags.boolean({ default: false })
  declare active: boolean

  // Rate limit circuit breaker properties
  private consecutiveRateLimitErrors = 0
  private readonly maxRateLimitErrors = 3

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await this.importProducts()

    if (this.type === 'delete') {
      await this.deleteProducts()
    }
  }

  async importProducts() {
    // Initialize ShopeeGraphQL service for the specified region
    const shopeeService = new ShopeeGraphQL(this.region)

    // Fetch sellers to process:
    // - Optionally filter by `is_active` if the command flag `--active` is true.
    // - Process sellers that have never been synced (`last_synced_at` is null)
    //   OR were last synced more than 12 hours ago.
    // - Select necessary seller details and order by ID.
    const sellers = await db
      .from('sellers')
      .if(this.active, (query) => query.where('is_active', true)) // Process only active sellers if --active flag is used
      .where((query) => {
        query
          .whereNull('last_synced_at')
          .orWhere('last_synced_at', '<', DateTime.local().minus({ hours: 12 }).toString())
      })
      .select('id', 'platform_seller_id', 'name', 'platform_id', 'last_synced_at') // Added last_synced_at
      .orderBy('id', 'asc')

    if (sellers.length === 0) {
      this.logger.info('No new or stale sellers to sync at this time.');
      return; // Exit if no sellers to process
    }

    for (const seller of sellers) {
      try {
        await this._processSeller(seller, shopeeService)
        this.consecutiveRateLimitErrors = 0
      } catch (error) {
        if (this._isRateLimitError(error)) {
          this.consecutiveRateLimitErrors++
          this.logger.error(`Rate limit error ${this.consecutiveRateLimitErrors}/${this.maxRateLimitErrors} for seller ${seller.id}: ${error.message}`)

          if (this.consecutiveRateLimitErrors >= this.maxRateLimitErrors) {
            this.logger.info(`Stopping sync due to ${this.consecutiveRateLimitErrors} consecutive rate limit errors.`)
            break
          }
        } else {
          this.logger.error(`Error processing seller ${seller.id}: ${error.message}`)
          this.consecutiveRateLimitErrors = 0
        }
      }
    }
    this.logger.info('Finished importing Shopee products.');
  }

  private async _processSeller(seller: any, shopeeService: ShopeeGraphQL) {
    if (seller.last_synced_at === null) {
      this.logger.info(`Processing NEW seller: ${seller.name} (ID: ${seller.id}) (never synced before)`);
    } else {
      // last_synced_at could be a string or Date depending on the DB driver, ensure it's a Date for Luxon
      const lastSyncedDate = typeof seller.last_synced_at === 'string' ? new Date(seller.last_synced_at) : seller.last_synced_at;
      const lastSyncedRelative = DateTime.fromJSDate(lastSyncedDate).toRelative();
      this.logger.info(`Processing STALE seller: ${seller.name} (ID: ${seller.id}) (last synced: ${lastSyncedRelative})`);
    }

    // Initialize variables for pagination and data aggregation for the current seller
    let hasNextPage = true // Flag to control pagination loop for Shopee API
    let page = 1 // Current page number for Shopee API
    let totalActiveProductsThisSync = 0
    let allProductsToUpsert: any[] = [] // Array to store all product data to be inserted or updated
    let allFetchedSellerCommissionProductIds: string[] = []
    let apiError = false // Flag to track if an API error occurred during fetching

    // --- API Data Fetching Loop (Paginates through Shopee API product offers) ---
    while (hasNextPage) {
      this.logger.log(`Fetching page ${page} for seller ID: ${seller.id}`)
      let data
      try {
        // Fetch products from Shopee API
        // - `isAMSOffer: true` filters for products we are designating as 'seller commission products'.
        data = await shopeeService.fetchProducts({
          shopId: seller.platform_seller_id,
          page: page,
          isAMSOffer: true, // This API flag identifies the products of interest
          isKeySeller: false
        })
      } catch (err) {
        this.logger.error(`API error for seller ${seller.id} (Page ${page}): ${err.message}`)
        sentry.captureException(err, {
          extra: {
            sellerId: seller.id,
            sellerName: seller.name,
            page: page,
            region: this.region,
          },
          tags: {
            sync_operation: 'fetch_shopee_products_for_seller',
          },
        });

        // Re-throw rate limit errors to trigger circuit breaker, set flag for others
        if (this._isRateLimitError(err)) {
          throw err
        }
        
        apiError = true
        break
      }

      // Extract product nodes and pagination info from API response
      const productsFromApi = data.data.productOfferV2.nodes || [] // Added || [] for safety
      page = data.data.productOfferV2.pageInfo.page + 1 // Increment page for next API call
      hasNextPage = data.data.productOfferV2.pageInfo.hasNextPage // Update hasNextPage based on API response

      this.logger.log(`Fetched ${productsFromApi.length} seller commission products on page ${page - 1} for seller ID: ${seller.id}`)

      // Prepare product data from the current API page
      let productsFromCurrentPage: any[] = []
      for (const product of productsFromApi) {
        // Collect all fetched seller commission product IDs for later use
        allFetchedSellerCommissionProductIds.push(product.itemId.toString());

        // Prepare category data
        const categoryPath = JSON.stringify(product.productCatIds);
        const lastCategoryId = product.productCatIds?.slice().reverse().find((id: number) => id !== 0) || 0;

        // Construct product object for database insertion/update
        productsFromCurrentPage.push({
          seller_id: seller.id,
          platform_item_id: product.itemId.toString(),
          name: product.productName,
          price_min: product.priceMin,
          price_max: product.priceMax,
          discount_rate: product.priceDiscountRate / 100,
          category_id: lastCategoryId,
          category_tree: categoryPath,
          url: product.productLink,
          image_url: product.imageUrl,
          rating: product.ratingStar,
          platform_commission_rate: product.shopeeCommissionRate,
          seller_commission_rate: product.sellerCommissionRate,
          sales: product.sales,
          active: true, // Product is active for seller commission (derived from isAMSOffer: true from API).
          created_at: DateTime.local().toString(),
          updated_at: DateTime.local().toString(),
        })
      }

      // Aggregate counts and product data
      totalActiveProductsThisSync += productsFromApi.length
      allProductsToUpsert = allProductsToUpsert.concat(productsFromCurrentPage)
    }
    // --- End of API Data Fetching Loop ---

    // ---- Database Update Logic (Post-API Fetch for a Seller) ----

    // If an API error occurred during fetching for this seller, skip database updates and move to the next seller.
    if (apiError) {
      this.logger.error(`Skipping database updates for seller ID: ${seller.id} due to API error during product fetch.`)
      return;
    }

    // 1. Update Seller's Product Count (for these active products) and Sync Timestamp:
    //    - `active_product_count` (DB field) is updated with `totalActiveProductsThisSync`.
    //    - `last_synced_at` is updated to the current time.
    //    - The admin-controlled `is_active` flag is NOT modified here.
    await db.from('sellers').where('id', seller.id).update({
      active_product_count: totalActiveProductsThisSync, // DB field `active_product_count` now stores count of these products
      last_synced_at: new Date()
    });
    this.logger.info(`Seller ID: ${seller.id} - active_product_count set to ${totalActiveProductsThisSync}. Fetched ${totalActiveProductsThisSync} active products this sync.`);

    // 2. Update `active` Status for Existing Products NOT in Current API Response (for these active products):
    //    - For the current seller, find products in the DB whose `platform_item_id` were NOT present
    //      in the `allFetchedSellerCommissionProductIds` list from the API.
    //    - These products are no longer considered active for seller commission based on the API, so set `active: false`.
    //    - If `allFetchedSellerCommissionProductIds` is empty, this marks ALL existing products for this seller as `active: false`.
    const productsQuery = db.from('products')
      .where('seller_id', seller.id);

    if (allFetchedSellerCommissionProductIds.length > 0) {
      productsQuery.whereNotIn('platform_item_id', allFetchedSellerCommissionProductIds);
    } else {
      // If allFetchedSellerCommissionProductIds is empty, it means no seller commission products were returned by the API for this seller.
      // Thus, all existing products for this seller should have active set to false.
      // The query .where('seller_id', seller.id) without further platform_item_id filtering achieves this.
    }

    const updateResult = await productsQuery.update({ active: false, updated_at: new Date() });

    const affectedRowsCount = Array.isArray(updateResult) ? updateResult.length : updateResult; // Handle different return types for affected rows
    this.logger.info(`Seller ID: ${seller.id} - Marked ${affectedRowsCount} existing products with 'active: false' (no longer active products from API).`);

    // 3. Upsert (Insert or Update) active products Fetched from the API:
    //    - All products in `allProductsToUpsert` are marked `active: true`.
    //    - Uses a database transaction for atomicity.
    if (allProductsToUpsert.length > 0) {
      await db.transaction(async (trx) => {
        // Prepare columns for `ON DUPLICATE KEY UPDATE` (MySQL syntax).
        // Excludes `created_at` (should not change on update) and the unique key columns (`seller_id`, `platform_item_id`).
        const firstProduct = allProductsToUpsert[0];
        const columnsToUpdate = Object.keys(firstProduct)
          .filter(column => column !== 'created_at' && column !== 'seller_id' && column !== 'platform_item_id')
          .map(column => `${column}=VALUES(${column})`) // Use VALUES(column) to get the new value from the insert part
          .join(', ');

        // Generate the base INSERT SQL and bindings for multiple rows.
        const { sql, bindings } = db.table('products').multiInsert(allProductsToUpsert).toSQL()

        // Execute the raw query with `ON DUPLICATE KEY UPDATE`.
        await trx.rawQuery(`${sql} ON DUPLICATE KEY UPDATE ${columnsToUpdate}`, bindings as any[])
      })
      this.logger.info(`Seller ID: ${seller.id} - Upserted ${allProductsToUpsert.length} active products (new or updated).`);
    } else if (totalActiveProductsThisSync === 0) {
      // This case means no active products were fetched from the API for this seller.
      // The deactivation step (2) above would have already marked any existing products with `active: false`.
      this.logger.info(`Seller ID: ${seller.id} - No new active products to upsert.`);
    }
    // ---- End of Database Update Logic ----
  }

  async deleteProducts() {
    // TODO: consider to soft delete products instead of hard delete
    // This method currently deletes products from sellers that are no longer active (`is_active: false` in the `sellers` table).
    // It does NOT directly use the new `products.active` flag, which indicates if a product *itself* is a seller commission product.
    // If the intention is to delete products that are `products.active: false`, this logic needs to be revised.
    await db.transaction(async (trx) => {
      await trx
        .from('products')
        .whereNotIn('seller_id', db.from('sellers').where('is_active', true).select('id'))
        .delete()
    })
  }

  private _isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    const rateLimitPatterns = ['too many requests', 'rate limit exceeded', 'try again in']
    return rateLimitPatterns.some(pattern => message.includes(pattern))
  }

  async completed(..._: any[]) {
    if (this.error) {
      this.logger.error(this.error)
      sentry.captureMessage(this.error.message, 'error')

      /**
       * Notify Ace that error has been handled
       */
      return true
    }
  }
}
