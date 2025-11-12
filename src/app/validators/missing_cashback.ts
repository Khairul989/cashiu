import vine from '@vinejs/vine'

export const storeMissingCashbackValidator = vine.compile(
  vine.object({
    clickId: vine.string(),
    orderId: vine.string(),
    email: vine.string().email().optional(),
  })
)
