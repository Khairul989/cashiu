import vine from '@vinejs/vine'

export const bankAccountValidator = vine.compile(
    vine.object({
        bankId: vine.number(),
        accountHolderName: vine.string().trim().maxLength(255),
        accountNumber: vine.string().trim().maxLength(50),
    })
)
