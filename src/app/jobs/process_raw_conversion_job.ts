import Conversion from '#models/conversion'
import PlatformOffer from '#models/platform_offer'
import RawConversion from '#models/raw_conversion'
import ShopeeMyConversionProcess from '#services/conversions/shopee_my'
import AddReferralReward from '#services/reward/add_referral_reward'
import AddFirstPurchaseBonusReward from '#services/reward/add_first_purchase_reward'
import { InvolveAsiaConversionData } from '#types/conversion'
import type { Job, JobHandlerContract } from '@acidiney/bull-queue/types'
import sentry from '@benhepburn/adonis-sentry/service'

export type ProcessRawConversionJobPayload = {
  rawConversionId: number
  conversionData: InvolveAsiaConversionData
}

export interface ConversionProcessContract {
  handle(involveConversionData: InvolveAsiaConversionData): Promise<Conversion>
}

export default class ProcessRawConversionJob
  implements JobHandlerContract<ProcessRawConversionJobPayload>
{
  async handle(job: Job<ProcessRawConversionJobPayload>) {
    const conversionData = job.data.conversionData
    const processedAt = new Date()
    let remarks: string | null = null

    const handler = await this.getHandler(conversionData.offer_id)

    if (!handler) {
      await RawConversion.query().where('id', job.data.rawConversionId).update({
        processedAt,
        remarks: 'No handler found',
      })

      return
    }

    let conversion!: Conversion

    try {
      conversion = await handler.handle(conversionData)
    } catch (error) {
      sentry.captureException(error)

      remarks = error instanceof Error ? error.message : 'Unknown error'
    }

    await RawConversion.query().where('id', job.data.rawConversionId).update({
      processedAt,
      remarks,
    })

    if (remarks !== null) {
      return
    }

    await new AddReferralReward().handle(conversion)
    await new AddFirstPurchaseBonusReward().handle(conversion)
  }

  /**
   * This is an optional method that gets called if it exists when the retries has exceeded and is marked failed.
   */
  async failed(_job: Job<ProcessRawConversionJobPayload>) {}

  async getHandler(offerId: number): Promise<ConversionProcessContract | null> {
    const platformOffer = await PlatformOffer.query()
      .preload('platform')
      .where('offer_id', offerId)
      .first()

    const platformName = platformOffer?.platform?.name.toLowerCase() ?? ''

    if (platformName.includes('shopee my')) {
      return new ShopeeMyConversionProcess()
    }

    return null
  }
}
