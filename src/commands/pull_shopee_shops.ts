import { ShopeeGraphQL } from '#services/shopee_graphql'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import sentry from '@benhepburn/adonis-sentry/service'

export default class PullShopeeShops extends BaseCommand {
  static commandName = 'pull:shopee-shops'
  static description = 'Pull shops from Shopee API'

  @flags.string({ default: 'my' })
  declare region: string

  @flags.array({ default: [1, 2, 4] })
  declare categories: number[]

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: true,
  }

  hasNextPage = true
  sortType = 3
  page = 1
  limit = 50

  async run() {
    const shopeeService = new ShopeeGraphQL(this.region)
    while (this.hasNextPage) {
      const data = await shopeeService.fetchShops({
        limit: this.limit,
        page: this.page,
        sortType: this.sortType,
        shopType: this.categories,
        isKeySeller: true,
      })

      const shops = data.data.shopOfferV2.nodes
      this.page = data.data.shopOfferV2.pageInfo.page + 1
      this.hasNextPage = data.data.shopOfferV2.pageInfo.hasNextPage

      for (const shop of shops) {
        this.logger.info(`Processing shop ${shop.shopName}`)

        await shopeeService.saveSeller(shop)
      }
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
