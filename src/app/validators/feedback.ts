import vine from '@vinejs/vine'

export const feedbackValidator = vine.withMetaData<{ userId: number | null }>().compile(
  vine.object({
    userAgent: vine.string().trim().minLength(1),
    feedbackText: vine.string().trim().minLength(1).maxLength(300),
    feedbackType: vine.string().trim().minLength(1).maxLength(300),
    email: vine
      .string()
      .email()
      .optional()
      .requiredWhen((field) => field.meta.userId === null),
  })
)
