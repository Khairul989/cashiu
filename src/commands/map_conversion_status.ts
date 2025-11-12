import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import Conversion from '#models/conversion'
import MasterLookup from '#models/master_lookup'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import sentry from '@benhepburn/adonis-sentry/service'

export default class MapConversionStatus extends BaseCommand {
  static commandName = 'map:conversion-status'
  static description = 'Map conversion statuses to the simplified conversion status'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    const conversionStatuses = await getKeyByLookUpType('conversion_status')

    await Conversion.query()
      .preload('status')
      .whereNotIn('statusId', [
        conversionStatuses['pending'],
        conversionStatuses['approved'],
        conversionStatuses['rejected'],
        conversionStatuses['paid'],
      ])
      .then(async (conversions) => {
        this.logger.info(`Found ${conversions.length} conversions to map`)

        for (const conversion of conversions) {
          const mappedStatus = MasterLookup.getMappedConversionStatus(conversion.status.value)

          conversion.statusId = conversionStatuses[mappedStatus]
          await conversion.saveQuietly()

          this.logger.info(`Mapped conversion ${conversion.id} to ${mappedStatus}`)
        }
      })
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
