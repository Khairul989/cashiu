import Platform from '#models/platform'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
export default class extends BaseSeeder {
  async run() {
    const platform = await Platform.create({
      name: 'Shopee MY',
      logo: '/images/shopee_icon.jpg',
      banner: '/images/shopee_banner.png',
      validationTerm: 30,
      paymentTerm: 45,
      endpoint: 'https://shopee.com.my/shop/shop_id',
      terms: `<div style="text-align: justify; text-justify: inter-word;"><ol style="padding-left: 0;"><li>Cashiu must be the last link you clicked in order to get cashback. If other website links are clicked after clicking through Cashiu, cashback will not be tracked (e.g., coupon and deal websites).</li><li>If for some reason your payment made on the merchant page has failed, do click through Cashiu again and re-do your purchases to ensure tracking is still active.</li><li>Return to Cashiu and click through to the merchant every time you are making a new transaction.</li><li>If you are making 3 separate transactions on the merchant, you should click through Cashiu 3 times, each time before making a new purchase.</li><li>Accounts that engage in fraudulent orders or activities to game or cheat the cashback system will be banned, with cashback removed.</li></ol></div>`,
      guidelines: JSON.stringify({
        do: [
          'Ensure you are redirected from Cashiu to the specific product page before making a purchase.',
          'Your purchase must be made on the same device and within the same session.',
          'Always return to Cashiu and click through to the merchant before making a new transaction. If you\'re making multiple purchases, click through Cashiu separately for each one.',
          'If your payment fails, click through Cashiu again and redo the purchase to ensure cashback tracking remains active.',
          'Cashback will be calculated based on the total checkout price.',
          'Cashback will be credited to your account in approximately 2 days.',
        ],
        dont: [
          'Do not open other web pages, links, coupon, or deal websites after clicking through Cashiu, as this will disrupt cashback tracking.',
          'Cashback will not be given for orders that are returned, refunded, canceled, or made through live events.',
          'Accounts found engaging in fraudulent activities to manipulate the cashback system will be banned, and cashback will be revoked.',
          'Do not checkout using Cash-on-Delivery.',
        ],
      }),
    })

    await platform.related('platformOffers').create({
      offerId: 4223,
      merchantId: 103069,
      isPrimary: true,
      data: {
        appId: 12111300000,
      },
    })

    const seller = await platform.related('sellers').create({
      platformSellerId: '399430272',
      name: 'Shopee MY Seller',
      commissionRate: '0.17',
      rating: 4.7,
    })

    await seller.related('categories').attach([1])
  }
}
