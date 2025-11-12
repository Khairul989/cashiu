import vine from '@vinejs/vine'

export const webhookConversionValidator = vine.compile(
  vine.object({
    conversion_id: vine.number().withoutDecimals(),
  })
)


export const webhookConversionValidatorOld = vine.compile(
  vine.object({
    conversion_id: vine.number().withoutDecimals(),
    datetime_conversion: vine.string(),
    offer_id: vine.number().withoutDecimals(),
    offer_name: vine.string().optional(),
    sale_amount: vine.number(),
    revenue: vine.number(),
    payout: vine.number(),
    base_payout: vine.number(),
    bonus_payout: vine.number(),
    adv_sub1: vine.string().optional(),
    adv_sub2: vine.string().optional(),
    adv_sub3: vine.string().optional(),
    adv_sub4: vine.string().optional(),
    adv_sub5: vine.string().optional(),
    adv_sub6: vine.string().optional(),
    adv_sub7: vine.string().optional(),
    adv_sub8: vine.string().optional(),
    adv_sub9: vine.string().optional(),
    adv_sub10: vine.string().optional(),
    aff_sub1: vine.string().optional(),
    aff_sub2: vine.string().optional(),
    aff_sub3: vine.string().optional(),
    aff_sub4: vine.string().optional(),
    aff_sub5: vine.string().optional(),
    conversion_status: vine.enum(['pending', 'approved', 'rejected', 'paid', 'yet to consume']),
    affiliate_remarks: vine.string().optional(),
  })
)