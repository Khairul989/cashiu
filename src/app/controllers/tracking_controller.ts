import { affiliateLink } from '#helpers/seller_helper'
import { generateRandomId } from '#helpers/url_helper'
import Product from '#models/product'
import TrackingLink from '#models/tracking_link'
import User from '#models/user'
import { generateTrackingLinkValidator, trackingLinkIndexValidator } from '#validators/tracking'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class TrackingController {
  /**
   * @index
   * @tag Tracking Link
   * @description Get all tracking links
   * @operationId getTrackingLinks
   * @summary Get all tracking links
   * @paramUse(limiter)
   */
  public async index({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(trackingLinkIndexValidator)
    const { page = 1, limit = 10 } = payload

    const user = auth.use('api').user as User
    const trackingLinks = await TrackingLink.query()
      .preload('missingCashback')
      .preload('conversions', (query) => query.where('myrSaleAmount', '>', 0))
      .preload('product', (query) => query.preload('seller', (query) => query.preload('platform')))
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
      .then((result) => {
        const data = result.all().map((link) => ({
          clickId: link.clickId,
          createdAt: link.createdAt,
          clicksHasConversions: link.conversions.length > 0,
          showHelpButton: DateTime.now().diff(link.createdAt, 'hours').hours > 72,
          sellerId: link.product.seller.id,
          sellerName: link.product.seller.name,
          productId: link.product.id,
          productName: link.product.name,
          productImage: link.product.imageUrl,
          productUrl: link.product.url,
          platformName: link.product.seller.platform.name,
          platformLogo: link.product.seller.platform.logo,
          missingCashbackSubmitted: !!link.missingCashback,
        }))

        result.baseUrl(request.url())
        result.queryString(request.qs())

        return {
          meta: result.getMeta(),
          data,
        }
      })

    return response.ok(trackingLinks)
  }
  /**
   * @generateLink
   * @tag Tracking Link
   * @description Generate a tracking link for a product click
   * @operationId generateTrackingLink
   * @summary Generate a tracking link
   * @paramQuery productId - Product ID - @type(number) @required
   */
  public async generateLink({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(generateTrackingLinkValidator)

    const user = auth.use('api').user as User
    const product = await Product.query()
      .preload('seller', (query) => query.preload('platform'))
      .where('id', payload.productId)
      .firstOrFail()

    const clickId = generateRandomId()
    const generatedAffiliateLink = await affiliateLink(
      user,
      product.seller.platform,
      product,
      clickId
    )

    const click = await TrackingLink.create({
      clickId,
      productId: product.id,
      userId: user.id,
      trackingLink: generatedAffiliateLink,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent', ''),
    })

    return response.ok({
      clickId: click.clickId,
      link: click.trackingLink,
      productId: product.id,
      sellerName: product.seller.name,
    })
  }
}
