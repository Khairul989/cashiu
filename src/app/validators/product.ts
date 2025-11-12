import vine from '@vinejs/vine'

export const productUrlValidator = vine.compile(
  vine.object({
    id: vine.number().optional().requiredIfMissing('url'),
    url: vine.string().url().trim().minLength(1).optional().requiredIfMissing('id'),
  })
)

export const productIndexValidator = vine.compile(
  vine.object({
    search: vine.string().optional(),
    type: vine.enum(['all', 'community']).optional(),
    sellerId: vine.number().optional(),
    featured: vine.boolean().optional(),
    sort: vine.enum(['sales', 'created_at', 'commission', 'price']).optional(),
    order: vine.enum(['asc', 'desc']).optional().requiredIfExists('sort'),
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
    random: vine.number().optional(),
    pCategoryId: vine.number().optional(),
  })
)

export const activityHistoryValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
  })
)
