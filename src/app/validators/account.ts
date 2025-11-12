import vine from '@vinejs/vine'

export const updateAccountValidator = vine.compile(
  vine.object({
    notification: vine.boolean().optional(),
  })
)
