import { floorDecimalPoints } from '#helpers/number_helper'
import Conversion from '#models/conversion'
import Postback from '#models/postback'
import type { Job, JobHandlerContract } from '@acidiney/bull-queue/types'
import axios from 'axios'

export type PostbackConversionJobPayload = {
  conversionId: number
}

export default class PostbackConversionJob
  implements JobHandlerContract<PostbackConversionJobPayload>
{
  private postbacks: Postback[] = []
  private conversion!: Conversion

  async handle(job: Job<PostbackConversionJobPayload>) {
    const { conversionId } = job.data

    this.postbacks = await Postback.all()

    if (this.postbacks.length === 0) {
      return
    }

    this.conversion = await Conversion.query()
      .preload('user', (query) =>
        query.preload('userReferral', (query) => query.preload('referralProgram'))
      )
      .preload('product')
      .preload('status')
      .where('id', conversionId)
      .firstOrFail()

    for (const postback of this.postbacks) {
      const method = postback.method
      const headers = postback.headers || {}
      const body = this.prepareBody()

      await axios
        .request({
          method,
          url: postback.url,
          headers,
          data: body,
        })
        .then(async (response) => {
          await postback.related('postbackLogs').create({
            url: postback.url,
            method,
            headers,
            body,
            statusCode: response.status,
            response: response.data,
            remarks: postback.remarks,
          })
        })
        .catch(async (error) => {
          await postback.related('postbackLogs').create({
            url: postback.url,
            method,
            headers,
            body,
            statusCode: error.response?.status || 0,
            response: error.response?.data || error.message,
            remarks: postback.remarks,
          })
        })
    }
  }

  async failed(_job: Job<PostbackConversionJobPayload>) {}

  private prepareBody(): Record<string, any> {
    if (this.conversion.user.userReferral?.referralProgram?.name?.toLowerCase().includes('jooal')) {
      return {
        id: this.conversion.id,
        rereferralCode: this.conversion.user.referralCode || '',
        conversion: this.conversion.datetimeConversion.toFormat('yyyy-MM-dd HH:mm'),
        currency: 'MYR',
        cashbackPayout: floorDecimalPoints(
          this.conversion.myrPayout *
            (this.conversion.user.userReferral?.referralProgram?.config?.mlm_incentive || 0.2)
        ),
        casbackStatus: this.conversion.status.value,
        remarks: 'Order created via Cashiu webhook',
        products: [
          {
            productName: this.conversion.product?.name || '',
            category: this.conversion.category || '',
            qty: this.conversion.advSubs?.adv_sub9 || 1,
          },
        ],
      }
    }

    throw new Error('body not found')
  }
}
