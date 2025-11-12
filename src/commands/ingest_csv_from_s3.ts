import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'
import { DateTime } from 'luxon'

// S3 Path Configuration - Update these paths as needed
const S3_PATHS = {
  PRODUCT_PATCH: 'seller_cashback/product_patch.csv',      // Updates existing products
  SELLER_INSERT: 'seller_cashback/seller_to_insert.csv',   // Inserts new sellers
  PRODUCT_INSERT: 'seller_cashback/product_insert.csv',    // Inserts new products
} as const

export default class IngestDatafeedFromS3 extends BaseCommand {
  static commandName = 'ingest:datafeed-from-s3'
  static description = 'Ingest datafeed CSV files from S3 buckets for products, sellers, and deactivations'

  @flags.string({
    description: 'AWS region for S3 bucket',
    default: 'ap-southeast-1'
  })
  declare region: string

  @flags.string({
    description: 'S3 bucket name',
    default: 'involve-data'
  })
  declare bucket: string

  @flags.string({
    description: 'Batch size for database operations',
    default: '1000'
  })
  declare batchSize: string

  @flags.boolean({
    description: 'Dry run mode - process files but don\'t write to database',
    default: false
  })
  declare dryRun: boolean

  @flags.string({
    description: 'Execution sequence (comma-separated): PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT',
    default: 'PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT'
  })
  declare sequence: string

  static options: CommandOptions = {
    startApp: true,
  }

  private s3Client: any

  async run() {
    try {
      await this.initializeS3Client()

      this.logger.info('Starting datafeed ingestion from S3...')

      // Parse and validate sequence
      const sequenceSteps = this.parseSequence()
      this.logger.info(`Execution sequence: ${sequenceSteps.join(' -> ')}`)

      // Process each type of CSV file based on sequence
      for (const step of sequenceSteps) {
        switch (step) {
          case 'PRODUCT_PATCH':
            await this.processProductPatch()
            break
          case 'SELLER_INSERT':
            await this.processSellersToInsert()
            break
          case 'PRODUCT_INSERT':
            await this.processProductsToInsert()
            break
          default:
            this.logger.warning(`Unknown sequence step: ${step}`)
        }
      }

      this.logger.success('Datafeed ingestion completed successfully!')

    } catch (error) {
      this.logger.error('Datafeed ingestion failed:', error.message)
      sentry.captureException(error)
      throw error
    }
  }

  private parseSequence(): string[] {
    const validSteps = ['PRODUCT_PATCH', 'SELLER_INSERT', 'PRODUCT_INSERT']
    const steps = this.sequence
      .split(',')
      .map(step => step.trim().toUpperCase())
      .filter(step => {
        if (!validSteps.includes(step)) {
          this.logger.warning(`Invalid sequence step: ${step}. Valid steps are: ${validSteps.join(', ')}`)
          return false
        }
        return true
      })

    if (steps.length === 0) {
      this.logger.warning('No valid sequence steps found, using default sequence')
      return ['PRODUCT_PATCH', 'SELLER_INSERT', 'PRODUCT_INSERT']
    }

    return steps
  }

  private async initializeS3Client() {
    try {
      // Dynamic import of AWS SDK
      const { S3Client } = await import('@aws-sdk/client-s3')

      // Configure S3 client with credentials or fallback to IAM
      const s3Config: any = {
        region: this.region,
      }

      // Use explicit credentials if available, otherwise fallback to IAM/default credentials
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        s3Config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        this.logger.info('Using explicit AWS credentials from environment variables')
      } else {
        this.logger.info('Using default AWS credentials (IAM role, profile, or instance metadata)')
      }

      this.s3Client = new S3Client(s3Config)

      this.logger.info(`Initialized S3 client for region: ${this.region}`)
    } catch (error) {
      throw new Error(`Failed to initialize S3 client: ${error.message}`)
    }
  }

  private async listS3Files(prefix: string): Promise<string[]> {
    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })

      const response = await this.s3Client.send(command)

      return response.Contents?.map((obj: any) => obj.Key!).filter((key: string) => key.endsWith('.csv')) || []
    } catch (error) {
      throw new Error(`Failed to list S3 files for prefix ${prefix}: ${error.message}`)
    }
  }

  private async downloadAndParseCSV(key: string): Promise<any[]> {
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.s3Client.send(command)
      const csvContent = await response.Body!.transformToString()

      // Parse CSV content
      const lines = csvContent.trim().split('\n')
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))

      const data = lines.slice(1).map((line: string) => {
        const values = this.parseCSVLine(line)
        const row: any = {}
        headers.forEach((header: string, index: number) => {
          row[header] = values[index] || null
        })
        return row
      })

      return data
    } catch (error) {
      throw new Error(`Failed to download and parse CSV ${key}: ${error.message}`)
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: { value: string; wasQuoted: boolean }[] = []
    let current = ''
    let inQuotes = false
    let fieldWasQuoted = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes) {
          // Check if this is an escaped quote (double quote)
          if (i + 1 < line.length && line[i + 1] === '"') {
            // Escaped quote - add a single quote to current and skip next character
            current += '"'
            i += 2 // Skip both quotes
            continue
          } else {
            // End of quoted field
            inQuotes = false
          }
        } else {
          // Start of quoted field
          inQuotes = true
          fieldWasQuoted = true
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside of quotes
        result.push({ value: current, wasQuoted: fieldWasQuoted })
        current = ''
        fieldWasQuoted = false
      } else {
        // Regular character
        current += char
      }

      i++
    }

    // Add the last field
    result.push({ value: current, wasQuoted: fieldWasQuoted })

    // Clean up the values based on whether they were quoted
    return result.map(field => {
      if (field.wasQuoted) {
        // Preserve whitespace for quoted fields
        return field.value
      } else {
        // Trim whitespace for unquoted fields
        return field.value.trim()
      }
    })
  }

  private createProgressBar(total: number, label: string) {
    // Simple progress tracking since we don't have a progress bar library
    let current = 0
    return {
      increment: () => {
        current++
        const percentage = Math.round((current / total) * 100)
        process.stdout.write(`\r${label}: ${current}/${total} (${percentage}%)`)
      },
      stop: () => {
        process.stdout.write('\n')
      }
    }
  }

  private parseDateTime(dateTimeString: string | null | undefined): string | null {
    if (!dateTimeString || dateTimeString.trim() === '') {
      return null
    }

    try {
      // Try to parse as ISO string first
      let dt = DateTime.fromISO(dateTimeString.trim())

      // If invalid, try other common formats
      if (!dt.isValid) {
        // Try SQL format
        dt = DateTime.fromSQL(dateTimeString.trim())
      }

      if (!dt.isValid) {
        // Try common formats
        const formats = [
          'yyyy-MM-dd HH:mm:ss',
          'yyyy-MM-dd',
          'MM/dd/yyyy HH:mm:ss',
          'MM/dd/yyyy',
          'dd/MM/yyyy HH:mm:ss',
          'dd/MM/yyyy'
        ]

        for (const format of formats) {
          dt = DateTime.fromFormat(dateTimeString.trim(), format)
          if (dt.isValid) break
        }
      }

      if (dt.isValid) {
        return dt.toFormat('yyyy-MM-dd HH:mm:ss')
      } else {
        this.logger.warning(`Invalid datetime format: "${dateTimeString}", setting to null`)
        return null
      }
    } catch (error) {
      this.logger.warning(`Error parsing datetime "${dateTimeString}": ${error.message}, setting to null`)
      return null
    }
  }

  private async processProductPatch() {
    this.logger.info('Processing product_patch.csv files...')

    const files = await this.listS3Files(S3_PATHS.PRODUCT_PATCH)

    if (files.length === 0) {
      this.logger.warning('No product_patch.csv files found')
      return
    }

    this.logger.info(`Found ${files.length} product_patch.csv files`)

    for (const file of files) {
      this.logger.info(`Processing file: ${file}`)

      const data = await this.downloadAndParseCSV(file)

      if (data.length === 0) {
        this.logger.warning(`File ${file} is empty, skipping...`)
        continue
      }

      const progressBar = this.createProgressBar(data.length, `Processing ${file}`)

      // Process in batches
      const batchSize = parseInt(this.batchSize)

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        if (!this.dryRun) {
          await this.updateProductsBatch(batch)
        }

        // Update progress
        for (let j = 0; j < batch.length; j++) {
          progressBar.increment()
        }
      }

      progressBar.stop()
      this.logger.success(`Completed processing ${file}: ${data.length} records`)
    }
  }

  private async updateProductsBatch(batch: any[]) {
    const trx = await db.transaction()

    try {
      for (const record of batch) {
        const updateData: any = {}

        // Only update non-null values
        if (record.active !== null && record.active !== undefined) {
          updateData.active = record.active === 'true' || record.active === '1' || record.active === 1
        }

        if (record.seller_commission_rate !== null && record.seller_commission_rate !== undefined) {
          updateData.seller_commission_rate = parseFloat(record.seller_commission_rate)
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')

          await trx
            .from('products')
            .where('id', record.id)
            .update(updateData)
        }
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async processSellersToInsert() {
    this.logger.info('Processing seller_to_insert.csv files...')

    const files = await this.listS3Files(S3_PATHS.SELLER_INSERT)

    if (files.length === 0) {
      this.logger.warning('No seller_to_insert.csv files found')
      return
    }

    this.logger.info(`Found ${files.length} seller_to_insert.csv files`)

    for (const file of files) {
      this.logger.info(`Processing file: ${file}`)

      const data = await this.downloadAndParseCSV(file)

      if (data.length === 0) {
        this.logger.warning(`File ${file} is empty, skipping...`)
        continue
      }

      const progressBar = this.createProgressBar(data.length, `Processing ${file}`)

      // Process in batches
      const batchSize = parseInt(this.batchSize)

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        if (!this.dryRun) {
          await this.insertSellersBatch(batch)
        }

        // Update progress
        for (let j = 0; j < batch.length; j++) {
          progressBar.increment()
        }
      }

      progressBar.stop()
      this.logger.success(`Completed processing ${file}: ${data.length} records`)
    }
  }

  private async insertSellersBatch(batch: any[]) {
    const trx = await db.transaction()

    try {
      const sellersToInsert = batch.map(record => ({
        platform_seller_id: record.platform_seller_id,
        name: record.name,
        active_product_count: parseInt(record.active_product_count) || 0,
        commission_rate: parseFloat(record.commission_rate) || 0,
        rating: parseFloat(record.rating) || 0,
        image_url: record.image_url,
        platform_id: parseInt(record.platform_id) || 1,
        last_synced_at: this.parseDateTime(record.last_synced_at),
        is_active: true,
        is_featured: false,
        created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
        updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
      }))

      // Use INSERT IGNORE to skip duplicates
      const query = trx.table('sellers').multiInsert(sellersToInsert).toSQL()

      await trx.rawQuery(
        `INSERT IGNORE${query.sql.substring(6)}`, // Remove 'INSERT' and replace with 'INSERT IGNORE'
        query.bindings as any
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async processProductsToInsert() {
    this.logger.info('Processing product_insert.csv files...')

    const files = await this.listS3Files(S3_PATHS.PRODUCT_INSERT)

    if (files.length === 0) {
      this.logger.warning('No product_insert.csv files found')
      return
    }

    this.logger.info(`Found ${files.length} product_insert.csv files`)

    for (const file of files) {
      this.logger.info(`Processing file: ${file}`)

      const data = await this.downloadAndParseCSV(file)

      if (data.length === 0) {
        this.logger.warning(`File ${file} is empty, skipping...`)
        continue
      }

      const progressBar = this.createProgressBar(data.length, `Processing ${file}`)

      // Process in batches
      const batchSize = parseInt(this.batchSize)

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        if (!this.dryRun) {
          await this.insertProductsBatch(batch)
        }

        // Update progress
        for (let j = 0; j < batch.length; j++) {
          progressBar.increment()
        }
      }

      progressBar.stop()
      this.logger.success(`Completed processing ${file}: ${data.length} records`)
    }
  }

  private async insertProductsBatch(batch: any[]) {
    const trx = await db.transaction()

    try {
      // First, we need to get seller IDs based on platform_seller_id if provided
      const platformSellerIds = [...new Set(batch.map(record => record.platform_seller_id).filter(Boolean))]

      const sellerMap = new Map()
      if (platformSellerIds.length > 0) {
        const sellers = await trx
          .from('sellers')
          .whereIn('platform_seller_id', platformSellerIds)
          .select('id', 'platform_seller_id')

        sellers.forEach(seller => {
          sellerMap.set(seller.platform_seller_id, seller.id)
        })
      }

      const productsToInsert = batch
        .filter(record => {
          // Determine seller_id from either direct seller_id or platform_seller_id lookup
          let sellerId = null

          if (record.seller_id) {
            // Direct seller_id provided
            sellerId = parseInt(record.seller_id)
          } else if (record.platform_seller_id && sellerMap.has(record.platform_seller_id)) {
            // platform_seller_id provided and found in sellers table
            sellerId = sellerMap.get(record.platform_seller_id)
          }

          if (!sellerId) {
            if (record.platform_seller_id) {
              this.logger.warning(`Seller not found for platform_seller_id: ${record.platform_seller_id}`)
            } else {
              this.logger.warning(`No seller_id or platform_seller_id provided for product: ${record.platform_item_id}`)
            }
            return false
          }

          // Store the resolved seller_id back to the record for mapping
          record._resolved_seller_id = sellerId
          return true
        })
        .map(record => ({
          seller_id: record._resolved_seller_id,
          platform_item_id: record.platform_item_id,
          name: record.name,
          currency: record.currency || 'RM',
          price_min: parseFloat(record.price_min) || 0,
          price_max: parseFloat(record.price_max) || 0,
          discount_rate: parseFloat(record.discount_rate) || 0,
          category_id: parseInt(record.category_id) || null,
          category_tree: record.category_tree,
          url: record.url,
          image_url: record.image_url,
          rating: parseFloat(record.rating) || 0,
          platform_commission_rate: parseFloat(record.platform_commission_rate) || 0,
          seller_commission_rate: parseFloat(record.seller_commission_rate) || 0,
          sales: parseInt(record.sales) || 0,
          clicks: parseInt(record.clicks) || 0,
          active: record.active === 'true' || record.active === '1' || record.active === 1,
          created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
          updated_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
        }))

      if (productsToInsert.length === 0) {
        this.logger.warning('No valid products to insert in this batch')
        await trx.commit()
        return
      }

      // Use INSERT IGNORE to skip duplicates
      const query = trx.table('products').multiInsert(productsToInsert).toSQL()

      await trx.rawQuery(
        `INSERT IGNORE${query.sql.substring(6)}`, // Remove 'INSERT' and replace with 'INSERT IGNORE'
        query.bindings as any
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
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