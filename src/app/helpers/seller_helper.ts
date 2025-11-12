import Platform from '#models/platform'
import Product from '#models/product'
import User from '#models/user'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import * as feistel from 'feistel-cipher'

export const affiliateLink = async (
  user: User | undefined,
  platform: Platform,
  product: Product,
  clickId?: string | null
): Promise<string> => {
  await platform.loadOnce('primaryPlatformOffer')
  const primaryPlatformOffer = platform.primaryPlatformOffer

  const settings = await db
    .from('settings')
    .whereIn('key', ['involve_link', 'aff_sys_id', 'aff_id'])
    .then((rows) => {
      return rows.reduce(
        (acc: { [key: string]: string }, row: { key: string; value: string }) => {
          acc[row.key] = row.value
          return acc
        },
        {} as { involve_link: string; aff_sys_id: string; aff_id: string }
      )
    })

  if (!user) {
    user = await User.query().select('unique_id').where('id', 1).firstOrFail()
  }

  const cipher = new feistel.Cipher(env.get('APP_KEY'), 10)

  if (platform.name.toLowerCase().includes('shopee my')) {
    // https://s.shopee.com.my/an_redir?origin_link={encoded_deeplink}&affiliate_id=12111300000&sub_id={IA_affiliate_id}-{transaction_id}--{offer_id}-{aff_sub.aff_sub2.aff_sub3.aff_sub4.aff_sub5}

    const affSub = [user.uniqueId]

    if (clickId) {
      affSub.push(clickId)
    }

    const params = new URLSearchParams()
    params.append('origin_link', encodeURI(product.url))
    params.append('affiliate_id', primaryPlatformOffer?.data?.appId.toString() ?? '12111300000')
    params.append(
      'sub_id',
      `${settings.aff_id}-DIRECTLINK--${primaryPlatformOffer?.merchantId ?? '103069'}-${affSub.join('.')}`
    )

    return `https://s.shopee.com.my/an_redir?${params.toString()}`
  }

  const params = new URLSearchParams()
  params.append('offer_id', primaryPlatformOffer?.merchantId.toString() ?? '')
  params.append('aff_id', settings.aff_sys_id)
  params.append('source', 'mycashback')
  params.append('aff_sub', user.uniqueId)
  params.append('aff_sub2', cipher.encrypt(product.id.toString()).toString('hex'))
  params.append('url', product.url)

  return `${settings.involve_link}?${params.toString()}`
}

export const commissionRateDisplay = (commission: number | string): string => {
  commission = commissionRateDecimal(commission)

  if (commission === 0) {
    return 'No cashback'
  }

  return `Up to ${(commission * 100).toFixed(0)}% cashback`
}

export const commissionRateDecimal = (commission: number | string): number => {
  if (typeof commission === 'string') {
    if (commission.includes('%')) {
      commission = parseFloat(commission.match(/\d+/g)![0]) / 100
    } else {
      commission = parseFloat(commission)
    }
  }

  return commission
}
