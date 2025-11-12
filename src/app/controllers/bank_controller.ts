import type { HttpContext } from '@adonisjs/core/http'
import Bank from '#models/bank'
import redis from '@adonisjs/redis/services/main'

export default class BanksController {
    /**
     * @index
     * @description Get a list of active banks.
     * @responseBody 200 - {"data": [*{"id": "number", "bank_name": "string", "logo_url": "string"}] }
     */
    public async index({ response }: HttpContext) {
        const cacheKey = 'banks:active'
        const cacheTTL = 60 * 60 * 24 // 24 hours

        // Try to get from cache first
        const cachedBanks = await redis.get(cacheKey)
        if (cachedBanks) {
            return response.ok({ data: JSON.parse(cachedBanks) })
        }

        // Cache miss - query database
        const banks = await Bank.query()
            .where('is_active', true)
            .select('id', 'bank_name', 'swift_code', 'logo_url') // logo_url is not used, not yet in S3 bucket
            .orderBy('bank_name', 'asc')

        const appUrl = process.env.APP_URL

        banks.forEach((bank) => {
            bank.logoUrl = bank.swiftCode
                ? `${appUrl}/images/banks/my/${bank.swiftCode}.png`
                : `${appUrl}/images/banks/my/default.png`
        })

        // Cache the result
        await redis.setex(cacheKey, cacheTTL, JSON.stringify(banks))

        return response.ok({ data: banks })
    }
}
