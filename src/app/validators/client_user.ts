import vine from '@vinejs/vine'

export const clientUserIndexValidator = vine.compile(
  vine.object({
    email: vine.string().email().optional(),
    name: vine.string().optional(),
    referralCode: vine.string().optional(),
    page: vine.number().withoutDecimals().optional(),
    limit: vine.number().withoutDecimals().optional(),
  })
)
