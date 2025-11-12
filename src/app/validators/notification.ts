import vine from '@vinejs/vine'

export const notificationIndexValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
  })
)
