import { totalCommissionRate, userCommissionRate } from '#helpers/commission_helper'
import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import { floorDecimalPoints } from '#helpers/number_helper'
import { ConversionProcessContract } from '#jobs/process_raw_conversion_job'
import Conversion from '#models/conversion'
import MasterLookup from '#models/master_lookup'
import Product from '#models/product'
import Seller from '#models/seller'
import User from '#models/user'
import { ShopeeGraphQL } from '#services/shopee_graphql'
import { InvolveAsiaConversionData } from '#types/conversion'
import { DateTime } from 'luxon'
import NotifyUserConversion from './notify_conversion_user.js'

export default class ShopeeMyConversionProcess implements ConversionProcessContract {
  public async handle(rawConversionData: InvolveAsiaConversionData): Promise<Conversion> {
    // adv_sub5 (shopID | shop Type | attributionType)
    const sellerIdFromConversion = rawConversionData.adv_sub5?.split('|')[0]?.trim() ?? null
    const uniqueUserIdFromConversion = rawConversionData.aff_sub1
    const productIdFromConversion = rawConversionData.adv_sub10
    const orderId = rawConversionData.adv_sub1?.split('|')[1]?.trim() ?? null
    const clickId = rawConversionData.aff_sub2?.trim() ?? null
    const category = rawConversionData.adv_sub3?.trim() ?? null

    if (!sellerIdFromConversion) {
      throw new Error(
        `Seller ID ${sellerIdFromConversion} not found in conversion ${rawConversionData.conversion_id}`
      )
    }

    if (!productIdFromConversion) {
      throw new Error(
        `Product ID ${productIdFromConversion} not found in conversion ${rawConversionData.conversion_id}`
      )
    }

    if (!uniqueUserIdFromConversion) {
      throw new Error(
        `Unique User ID ${uniqueUserIdFromConversion} not found in conversion ${rawConversionData.conversion_id}`
      )
    }

    const user = await User.findByOrFail('unique_id', uniqueUserIdFromConversion)
    let seller = await Seller.findBy('platform_seller_id', sellerIdFromConversion)
    let product = await Product.findBy('platform_item_id', productIdFromConversion)

    const shopeeService = new ShopeeGraphQL('my')
    if (!seller) {
      const sellerData = await shopeeService.fetchShops({
        shopId: parseInt(sellerIdFromConversion),
      })

      if (sellerData.data.shopOfferV2.nodes.length === 0) {
        throw new Error(`Seller with ID ${sellerIdFromConversion} not found`)
      }

      seller = await shopeeService.saveSeller(sellerData.data.shopOfferV2.nodes[0])

      if (!seller) {
        throw new Error(`Failed to save seller with ID ${sellerIdFromConversion}`)
      }
    }

    if (!product) {
      const productData = await shopeeService.fetchProducts({
        itemId: parseInt(productIdFromConversion),
        shopId: parseInt(sellerIdFromConversion),
      })

      if (productData.data.productOfferV2.nodes.length === 0) {
        throw new Error(`Product with ID ${productIdFromConversion} not found`)
      }

      product = await shopeeService.saveProduct(productData.data.productOfferV2.nodes[0])

      if (!product) {
        throw new Error(`Failed to save product with ID ${productIdFromConversion}`)
      }
    }

    // get actual user commission rate without lowest commission rate available in system
    const userCommRate = await userCommissionRate(user.id, false)
    let sellerCommissionRate = totalCommissionRate(product, userCommRate)

    let saleAmount = parseFloat(rawConversionData.sale_amount ?? '0')
    let myrPayout = parseFloat(rawConversionData.revenue ?? '0')
    let cashbackPayout = floorDecimalPoints(myrPayout * userCommRate)

    // some conversions will have 0 sale amount, it is by design because
    // shopee return conversion amount only for the whole order and not for each product
    if (saleAmount > 0) {
      sellerCommissionRate = floorDecimalPoints(cashbackPayout / saleAmount, 4)
    }

    // map various conversion statuses to the simplified conversion status
    rawConversionData.conversion_status = MasterLookup.getMappedConversionStatus(
      rawConversionData.conversion_status
    )

    const conversionStatus = await getKeyByLookUpType('conversion_status')

    let conversion = await Conversion.findBy('conversionId', rawConversionData.conversion_id)
    if (!conversion) {
      conversion = new Conversion()
      conversion.conversionId = rawConversionData.conversion_id
    }

    conversion.sellerId = seller.id
    conversion.productId = product.id
    conversion.userId = user.id
    conversion.offerId = rawConversionData.offer_id
    conversion.orderId = orderId
    conversion.clickId = clickId
    conversion.datetimeConversion = DateTime.fromFormat(
      rawConversionData.datetime_conversion,
      'yyyy-MM-dd HH:mm:ss',
      { zone: 'Asia/Kuala_Lumpur' }
    )
    conversion.category = category
    conversion.myrSaleAmount = saleAmount
    conversion.myrPayout = myrPayout
    conversion.cashbackPayout = cashbackPayout
    conversion.sellerCommissionRate = sellerCommissionRate
    conversion.statusId = conversionStatus[rawConversionData.conversion_status]
    conversion.advSubs = {
      adv_sub: rawConversionData.adv_sub1,
      adv_sub2: rawConversionData.adv_sub2,
      adv_sub3: rawConversionData.adv_sub3,
      adv_sub4: rawConversionData.adv_sub4,
      adv_sub5: rawConversionData.adv_sub5,
      adv_sub6: rawConversionData.adv_sub6,
      adv_sub7: rawConversionData.adv_sub7,
      adv_sub8: rawConversionData.adv_sub8,
      adv_sub9: rawConversionData.adv_sub9,
      adv_sub10: rawConversionData.adv_sub10,
    }
    conversion.affSubs = {
      aff_sub: rawConversionData.aff_sub1,
      aff_sub2: rawConversionData.aff_sub2,
      aff_sub3: rawConversionData.aff_sub3,
      aff_sub4: rawConversionData.aff_sub4,
      aff_sub5: rawConversionData.aff_sub5,
    }

    let sendNotification = conversion.$isDirty || conversion.$isNew

    await conversion.save()

    if (conversion.myrSaleAmount === 0 || !conversion.withdrawalId) {
      sendNotification = false
    }

    if (sendNotification) {
      await new NotifyUserConversion().handle(conversion)
    }

    return conversion
  }
}
