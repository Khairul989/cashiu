import { middleware } from '#start/kernel'
import { throttle } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const AccountController = () => import('#controllers/account_controller')
const DeviceTokenController = () => import('#controllers/device_token_controller')
const EarningController = () => import('#controllers/earning_controller')
const WithdrawalController = () => import('#controllers/withdrawal_controller')
const TransactionController = () => import('#controllers/transaction_controller')
const SellerController = () => import('#controllers/seller_controller')
const CategoryController = () => import('#controllers/category_controller')
const ProductController = () => import('#controllers/product_controller')
const FeedbackController = () => import('#controllers/feedback_controller')
const ProductCategoryController = () => import('#controllers/product_category_controller')
const BankController = () => import('#controllers/bank_controller')
const UserBankAccountController = () => import('#controllers/user_bank_account_controller')
const NotificationController = () => import('#controllers/notification_controller')
const TrackingController = () => import('#controllers/tracking_controller')
const MissingCashbackController = () => import('#controllers/missing_cashback_controller')
const ClientUserController = () => import('#controllers/client_user_controller')
const ReferralController = () => import('#controllers/referral_controller')

router
  .group(() => {
    router
      .group(() => {
        router
          .group(() => {
            router.get('account', [AccountController, 'show'])
            router.post('account', [AccountController, 'update'])
            router.delete('account', [AccountController, 'destroy'])

            router.get('account/bank-details', [UserBankAccountController, 'show'])
            router.post('account/bank-details', [UserBankAccountController, 'store'])
            router.put('account/bank-details', [UserBankAccountController, 'update'])

            router.post('device', [DeviceTokenController, 'store'])
            router.delete('device/:token', [DeviceTokenController, 'destroy'])

            router.get('earnings', [EarningController, 'index'])

            router.get('transactions', [TransactionController, 'index'])
            router.get('transactions/:id', [TransactionController, 'show'])

            router.get('withdrawals', [WithdrawalController, 'index'])
            router.get('withdrawals/:id', [WithdrawalController, 'show'])
            router.post('withdrawals', [WithdrawalController, 'store'])

            router.post('products/:id/click', [ProductController, 'click'])
            router.get('products/activity-history', [ProductController, 'activityHistory'])
            router.delete('products/activity-history', [
              ProductController,
              'deleteAllActivityHistory',
            ])

            router.get('notifications', [NotificationController, 'index'])
            router.get('notifications/:id', [NotificationController, 'show'])
            router.patch('notifications/:id/read', [NotificationController, 'markAsRead'])
            router.patch('notifications/read', [NotificationController, 'markAllAsRead'])
            router.delete('notifications/:id', [NotificationController, 'delete'])
            router.delete('notifications', [NotificationController, 'deleteAll'])

            router.get('tracking-link', [TrackingController, 'index'])
            router.post('tracking-link/generate', [TrackingController, 'generateLink'])

            router.post('missing-cashback', [MissingCashbackController, 'store'])

            router.get('referral', [ReferralController, 'index'])
            router.post('referral', [ReferralController, 'store'])
          })
          .middleware([middleware.auth({ guards: ['api'] })])

        router.get('sellers', [SellerController, 'index'])
        router.get('sellers/homepage', [SellerController, 'homepage'])
        router.get('sellers/:id', [SellerController, 'show'])

        router.get('categories', [CategoryController])

        router.get('products', [ProductController, 'index'])
        router.get('products/detail', [ProductController, 'detail'])

        router.get('product-categories', [ProductCategoryController, 'index'])
        router.get('product-categories/hierarchy', [ProductCategoryController, 'hierarchy'])
        router.get('product-categories/subcategories', [ProductCategoryController, 'subcategories'])

        router.post('feedback', [FeedbackController])

        router.get('misc/banks', [BankController, 'index'])

        router.get('client/users', [ClientUserController, 'index'])
      })
      .middleware([middleware.enforceJson(), middleware.silentAuth({ guards: ['api'] })])
  })
  .prefix('api')
  .use(throttle)
