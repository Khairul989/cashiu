import { getKeyByLookUpType } from '#helpers/master_lookup_helper'
import Bank from '#models/bank'
import User from '#models/user'
import UserBankAccount from '#models/user_bank_account'
import Withdrawal from '#models/withdrawal'
import { bankAccountValidator } from '#validators/bank_account'
import type { HttpContext } from '@adonisjs/core/http'

export default class UserBankAccountController {
    /**
     * @show
     * @tag User Bank Account
     * @operationId getUserBankAccount
     * @summary Get the authenticated user's bank account details
     * @description Get the authenticated user\'s bank account details.
     * @responseBody 200 - {"serverCode": "USER_BANK_ACCOUNT_FOUND", "message": "Bank account details retrieved successfully.", "data": <UserBankAccount>}
     * @responseBody 404 - {"serverCode": "USER_BANK_ACCOUNT_NOT_FOUND", "message": "Bank account details not found."}
     */
    public async show({ auth, response }: HttpContext) {
        const user: User = auth.user as User
        const userBankAccount = await UserBankAccount.query()
            .where('user_id', user.id)
            .preload('bank')
            .preload('paymentMethod')
            .first()

        if (!userBankAccount) {
            return response.notFound({
                message: 'bankAccountNotFound',
            })
        }

        // Add logoUrl to the bank object
        const appUrl = process.env.APP_URL
        if (userBankAccount.bank) {
            userBankAccount.bank.logoUrl = userBankAccount.bank.swiftCode
            ? `${appUrl}/images/banks/my/${userBankAccount.bank.swiftCode}.png`
            : `${appUrl}/images/banks/my/default.png`
        }


        return response.ok({
            accountHolderName: userBankAccount.accountHolderName,
            accountNumber: userBankAccount.accountNumber, // Consider masking this in the response
            bank: userBankAccount.bank,
        })
    }

    /**
     * @store
     * @tag User Bank Account
     * @operationId createUserBankAccount
     * @summary Add bank account details for the authenticated user
     * @description Add bank account details for the authenticated user.
     * @requestBody <CreateUserBankAccountValidator>
     * @responseBody 201 - {"serverCode": "USER_BANK_ACCOUNT_CREATED", "message": "Bank account created successfully.", "data": <UserBankAccount>}
     * @responseBody 400 - {"serverCode": "USER_BANK_ACCOUNT_CREATE_CONFLICT", "message": "User already has bank account details. Use PUT to update."} or {"serverCode": "USER_BANK_ACCOUNT_BANK_INACTIVE", "message": "Selected bank is not active."} or {"serverCode": "DEFAULT_PAYMENT_METHOD_NOT_FOUND", "message": "Default payment method 'bank_transfer' not configured."}
     * @responseBody 422 - Validation errors
     */
    public async store({ auth, request, response }: HttpContext) {
        const user: User = auth.user as User
        const payload = await request.validateUsing(bankAccountValidator)

        const existingAccount = await UserBankAccount.findBy('user_id', user.id)
        if (existingAccount) {
            return response.badRequest({
                message: 'bankAccountAlreadyExists',
            })
        }

        const bank = await Bank.findOrFail(payload.bankId)
        if (!bank.isActive) {
            return response.badRequest({
                message: 'bankNotActive',
            })
        }

        // Get default payment method ID for 'bank_transfer'
        const paymentMethods = await getKeyByLookUpType('payment_method')
        const bankTransferPaymentMethodId = paymentMethods['bank_transfer']

        const userBankAccount = await UserBankAccount.create({
            userId: user.id,
            bankId: payload.bankId,
            accountHolderName: payload.accountHolderName,
            accountNumber: payload.accountNumber,
            paymentMethodId: bankTransferPaymentMethodId as number,
        })

        await userBankAccount.load('bank')
        await userBankAccount.load('paymentMethod')
        return response.created({
            message: 'bankAccountCreated',
        })
    }

    /**
     * @update
     * @tag User Bank Account
     * @operationId updateUserBankAccount
     * @summary Update the authenticated user's bank account details
     * @description Update the authenticated user\'s bank account details.
     * @requestBody <UpdateUserBankAccountValidator>
     * @responseBody 200 - {"serverCode": "USER_BANK_ACCOUNT_UPDATED", "message": "Bank account updated successfully.", "data": <UserBankAccount>}
     * @responseBody 400 - {"serverCode": "USER_BANK_ACCOUNT_BANK_INACTIVE", "message": "Selected bank is not active."}
     * @responseBody 403 - {"serverCode": "USER_BANK_ACCOUNT_UPDATE_FORBIDDEN_PENDING_WITHDRAWAL", "message": "Cannot update bank details while withdrawals are pending."}
     * @responseBody 404 - {"serverCode": "USER_BANK_ACCOUNT_UPDATE_NOT_FOUND", "message": "Bank account details not found to update."}
     * @responseBody 422 - Validation errors
     */
    public async update({ auth, request, response }: HttpContext) {
        const user: User = auth.user as User
        const payload = await request.validateUsing(bankAccountValidator)

        const userBankAccount = await UserBankAccount.findBy('user_id', user.id)
        if (!userBankAccount) {
            return response.notFound({
                message: 'bankAccountNotFound',
            })
        }

        const withdrawalStatuses = await getKeyByLookUpType('withdrawal_status')
        const requestedStatusId = withdrawalStatuses['requested']

        const pendingWithdrawals = await Withdrawal.query()
            .where('user_id', user.id)
            .where('status_id', requestedStatusId)
            .first()

        if (pendingWithdrawals) {
            return response.forbidden({
                message: 'pendingWithdrawalsExist',
            })
        }

        const bank = await Bank.findOrFail(payload.bankId)
        if (!bank.isActive) {
            return response.badRequest({
                message: 'bankNotActive',
            })
        }

        userBankAccount.merge({
            bankId: payload.bankId,
            accountHolderName: payload.accountHolderName,
            accountNumber: payload.accountNumber,
        })
        await userBankAccount.save()

        await userBankAccount.load('bank')
        await userBankAccount.load('paymentMethod')
        return response.ok({
            message: 'bankAccountUpdated',
        })
    }
}
