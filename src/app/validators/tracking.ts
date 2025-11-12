import vine from '@vinejs/vine'

export const trackingLinkIndexValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
  })
)

export const generateTrackingLinkValidator = vine.compile(
  vine.object({
    productId: vine.number().positive().withoutDecimals(),
  })
)
