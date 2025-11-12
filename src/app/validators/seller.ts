import vine from '@vinejs/vine'

export const sellerIndexValidator = vine.compile(
  vine.object({
    search: vine.string().optional(),
    filter: vine
      .object({
        ratingRange: vine.enum(['0', '>1', '>2', '>3', '>4', '5']).optional(),
        commissionRange: vine
          .object({
            min: vine.number().positive().range([0, 1]).optional().requiredIfExists('max'),
            max: vine.number().positive().range([0, 1]).optional().requiredIfExists('min'),
          })
          .optional(),
      })
      .optional(),
    featured: vine.boolean().optional(),
    sort: vine.enum(['rating', 'commission', 'createdAt']).optional(),
    order: vine.enum(['asc', 'desc']).optional().requiredIfExists('sort'),
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
  })
)
