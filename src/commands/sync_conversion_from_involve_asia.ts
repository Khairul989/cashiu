import Conversion from '#models/conversion'
import RawConversion from '#models/raw_conversion'
import env from '#start/env'
import { InvolveAsiaConversionApiResponse } from '#types/conversion'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import limiter from '@adonisjs/limiter/services/main'
import sentry from '@benhepburn/adonis-sentry/service'
import JWT from 'jsonwebtoken'
import { DateTime } from 'luxon'

export default class SyncConversionFromInvolveAsia extends BaseCommand {
  static commandName = 'sync:conversion'
  static description = 'Sync conversion from Involve Asia'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  @flags.string({
    flagName: 'start-date',
    description: 'Start date for conversion sync',
    default: DateTime.local().minus({ days: 7 }).toFormat('yyyy-MM-dd'),
  })
  declare startDate: string

  @flags.string({
    flagName: 'end-date',
    description: 'End date for conversion sync',
    default: DateTime.local().toFormat('yyyy-MM-dd'),
  })
  declare endDate: string

  @flags.number({
    flagName: 'limit',
    description: 'Limit the number of conversions to sync',
    default: 200,
  })
  declare limit: number

  @flags.boolean({
    flagName: 'all',
    description: 'Sync all conversions',
    default: false,
  })
  declare all: boolean

  private apiBaseUrl = env.get('IA_EXTERNAL_API_URL', 'https://api.involve.asia/api')

  private apiKey = env.get('IA_API_KEY')

  private apiSecret = env.get('IA_API_SECRET')

  private token: string | null = null

  private tokenExpiry: number | null = null

  async run() {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Involve Asia API key or secret not found')
    }

    let rawConversions: RawConversion[] = []
    let uniqueConversionIds: number[] = []

    const notFoundConversionIds: number[] = []
    const foundConversionIds: number[] = []
    const duplicateRawConversionIds: number[] = []

    if (!this.all) {
      rawConversions = await RawConversion.query()
        .whereNull('processed_at')
        .select(['id', 'conversion_id'])

      if (rawConversions.length === 0) {
        console.log('No raw conversions to be processed, use --all to sync all conversions')

        return
      }

      uniqueConversionIds = [
        ...new Set(rawConversions.map((rawConversion) => rawConversion.conversionId)),
      ]
    }

    let page: number | null = 1

    while (page !== null) {
      const conversionData = await this.getConversions({ page, conversionIds: uniqueConversionIds })

      console.log(
        `${conversionData.data.data.length} from page ${page} found from Involve Asia API`
      )

      page = conversionData.data.nextPage ?? null

      if (!this.all) {
        const groupedRawConversions = rawConversions
          .sort((a, b) => b.id - a.id) // sort by id desc to get the latest raw conversion
          .reduce(
            (acc, rawConversion) => {
              acc[rawConversion.conversionId] = [
                ...(acc[rawConversion.conversionId] || []),
                rawConversion,
              ]
              return acc
            },
            {} as Record<string, RawConversion[]>
          )

        for (const rawConversions of Object.values(groupedRawConversions)) {
          const rawConversion = rawConversions[0]
          const conversionFromInvolveAsia = conversionData.data.data.find(
            (conversion) => conversion.conversion_id === rawConversion.conversionId
          )

          if (!conversionFromInvolveAsia) {
            notFoundConversionIds.push(rawConversion.conversionId)

            continue
          }

          if (rawConversions.length > 1) {
            rawConversions.slice(1).forEach((rawConversion) => {
              duplicateRawConversionIds.push(rawConversion.id)
            })
          }

          rawConversion.rawData = conversionFromInvolveAsia
          foundConversionIds.push(rawConversion.conversionId)

          await rawConversion.save()

          await RawConversion.dispatchConversionProcessJob(rawConversion)
        }
      } else {
        const existingConversions = await Conversion.query()
          .select('conversion_id')
          .whereIn(
            'conversion_id',
            conversionData.data.data.map((c) => c.conversion_id)
          )

        const newConversions = conversionData.data.data.filter(
          (conversion) =>
            !existingConversions.some(
              (existingConversion) => existingConversion.conversionId === conversion.conversion_id
            )
        )

        for (const conversion of newConversions) {
          const rawConversion = await RawConversion.create({
            conversionId: conversion.conversion_id,
            rawData: conversion,
          })

          await RawConversion.dispatchConversionProcessJob(rawConversion)
        }
      }
    }

    console.log(`${notFoundConversionIds.length} raw conversions not found`)
    console.log(`${foundConversionIds.length} raw conversions found`)
    console.log(`${duplicateRawConversionIds.length} duplicate raw conversions found`)

    await RawConversion.query()
      .whereIn('conversion_id', notFoundConversionIds)
      .update({
        processedAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        remarks: 'Conversion not found',
      })

    await RawConversion.query()
      .whereIn('id', duplicateRawConversionIds)
      .update({
        processedAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        remarks: 'Duplicated raw conversion',
      })
  }

  async getConversions({
    conversionIds = [],
    page = 1,
  }: {
    conversionIds?: number[]
    page?: number
  }): Promise<InvolveAsiaConversionApiResponse> {
    await this.getAuthToken()

    const header = { Authorization: `Bearer ${this.token}` }
    const body = new URLSearchParams({
      'page': page.toString(),
      'limit': '200',
      'filters[preferred_currency]': 'MYR',
    })

    if (conversionIds.length > 0) {
      body.append('filters[conversion_id]', conversionIds.join('|'))
    }

    const conversionResponse = await this.fetchUrl({
      apiPathUrl: '/conversions/all',
      header,
      body,
    })

    if (!conversionResponse.ok) {
      throw new Error(
        `Failed to fetch conversions from Involve Asia API: ${conversionResponse.statusText}`
      )
    }

    return (await conversionResponse.json()) as InvolveAsiaConversionApiResponse
  }

  async getAuthToken() {
    // check if token is valid and not expired
    if (this.token && this.tokenExpiry && this.tokenExpiry > Math.floor(Date.now() / 1000)) {
      return
    }

    const authResponse = await this.fetchUrl({
      apiPathUrl: '/authenticate',
      body: new URLSearchParams({ key: this.apiKey as string, secret: this.apiSecret as string }),
    })

    if (!authResponse.ok) {
      throw new Error(`Failed to authenticate with Involve Asia API: ${authResponse.statusText}`)
    }

    const authData = (await authResponse.json()) as {
      status: string
      message: string
      data: {
        token: string
      }
    }

    const authToken = authData.data.token
    const decodedJwt = JWT.decode(authToken)

    if (!decodedJwt || typeof decodedJwt === 'string') {
      throw new Error('Invalid JWT token received from Involve Asia API')
    }

    this.token = authData.data.token
    this.tokenExpiry = decodedJwt.exp as number
  }

  async fetchUrl({
    apiPathUrl,
    header,
    body,
  }: {
    apiPathUrl: string
    header?: object
    body: URLSearchParams
  }) {
    const uniqueKey = `involve_asia_publisher_api`
    const requestsLimiter = limiter.use({
      requests: 20,
      duration: '1 minute',
      blockDuration: '2 minutes',
    })

    // for IA publisher API rate limiter which is 20/min
    try {
      await requestsLimiter.consume(uniqueKey)
    } catch (error) {
      const availableIn = await requestsLimiter.availableIn(uniqueKey)

      await new Promise((r) => setTimeout(r, availableIn * 1000))
    }

    let newHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    if (env.get('CF_ACCESS_CLIENT_ID') && env.get('CF_ACCESS_CLIENT_SECRET')) {
      newHeaders['CF-Access-Client-Id'] = env.get('CF_ACCESS_CLIENT_ID') as string
      newHeaders['CF-Access-Client-Secret'] = env.get('CF_ACCESS_CLIENT_SECRET') as string
    }

    try {
      return await fetch(`${this.apiBaseUrl}${apiPathUrl}`, {
        method: 'POST',
        headers: Object.assign({}, header, newHeaders),
        body,
      })
    } catch (error) {
      // Return a mock response object with error information instead of throwing
      return {
        ok: false,
        status: 0,
        statusText: error instanceof Error ? error.message : 'Network error',
        json: async () => ({ error: error instanceof Error ? error.message : 'Network error' }),
      } as Response
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
