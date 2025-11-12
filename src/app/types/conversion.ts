export type conversionEarnings = {
  earnings: string
}

export type InvolveAsiaConversionApiResponse = {
  status: string
  message: string
  data: {
    page: number
    limit: number
    count: number
    nextPage: number | null
    data: InvolveAsiaConversionData[]
  }
}

export type InvolveAsiaConversionData = {
  conversion_id: number
  datetime_conversion: string
  offer_id: number
  offer_name: string
  sale_amount: string
  revenue: string
  payout: string
  base_payout: string
  bonus_payout: string
  adv_sub1: string | null
  adv_sub2: string | null
  adv_sub3: string | null
  adv_sub4: string | null
  adv_sub5: string | null
  adv_sub6: string | null
  adv_sub7: string | null
  adv_sub8: string | null
  adv_sub9: string | null
  adv_sub10: string | null
  aff_sub1: string | null
  aff_sub2: string | null
  aff_sub3: string | null
  aff_sub4: string | null
  aff_sub5: string | null
  conversion_status: string
  affiliate_remarks: string | null
}