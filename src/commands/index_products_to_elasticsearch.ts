import { BaseCommand } from '@adonisjs/core/ace'
import { ElasticsearchService } from '#services/elasticsearch_service'
import { CommandOptions } from '@adonisjs/core/types/ace'
import cliProgress from 'cli-progress'
import Product from '#models/product'


export default class IndexProductsToElasticsearch extends BaseCommand {
  static commandName = 'index:products'
  static description = 'Bulk Index all products to Elasticsearch with efficient batching'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      const totalStartTime = Date.now()

      this.logger.info('Starting bulk product indexing...')

      // Count total products
      const countResult = await Product.query().count('* as total')
      const totalProducts = countResult[0].$extras.total || 0

      if (totalProducts === 0) {
        this.logger.info('No products found to index.')
        return
      }

      // Create progress bar
      const progressBar = new cliProgress.SingleBar({
        format: 'Indexing |{bar}| {percentage}% || {value}/{total} Products',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      })

      progressBar.start(totalProducts, 0)

      const esService = new ElasticsearchService()

      // Start bulk indexing timer
      const indexStartTime = Date.now()
      const result = await esService.bulkIndexProducts(1000, 5)
      const indexTime = Date.now() - indexStartTime

      progressBar.update(totalProducts)
      progressBar.stop()

      const totalTime = Date.now() - totalStartTime
      const throughput = (totalProducts / (indexTime / 1000)).toFixed(2)

      // Summary
      this.logger.info('')
      this.logger.info('╔═══════════════════════════════════════════════╗')
      this.logger.info('║            ✅ INDEXING SUMMARY                ║')
      this.logger.info('╚═══════════════════════════════════════════════╝')
      this.logger.info(`  Total Products: ${totalProducts}`)
      this.logger.info(`  Indexed: ${result.success} | Failed: ${result.failed}`)
      this.logger.info('')
      this.logger.info(`  ⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`)
      this.logger.info(`  ⏱️  Indexing Time: ${(indexTime / 1000).toFixed(2)}s`)
      this.logger.info(`  ⚡ Throughput: ${throughput} products/sec`)
      this.logger.info('╚═══════════════════════════════════════════════╝')

      if (result.failed > 0 && result.errors.length > 0) {
        this.logger.warning('\n⚠️  Errors found:')
        result.errors.slice(0, 5).forEach((err, i) => {
          this.logger.error(`   ${i + 1}. Product ${err.id}: ${err.error}`)
        })
      }
    } catch (error) {
      this.logger.error(
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
