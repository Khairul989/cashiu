import Conversion from '#models/conversion'
import Withdrawal from '#models/withdrawal'
import env from '#start/env'
import { middleware } from '#start/kernel'
import { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const WebhookController = () => import('#controllers/webhook_controller')
const AdminSellerController = () => import('#controllers/admin/seller_controller')
const AdminProductController = () => import('#controllers/admin/product_controller')
const AdminWithdrawalController = () => import('#controllers/admin/withdrawal_controller')
const AdminConversionController = () => import('#controllers/admin/conversion_controller')
const AdminMissingCashbackController = () =>
  import('#controllers/admin/missing_cashback_controller')

router.on('/').renderInertia('home').middleware([middleware.silentAuth()])
router.on('privacy-policy').renderInertia('privacy-policy')
router.on('terms-of-use').renderInertia('terms-of-use')
router.on('google-data-deletion-policy').renderInertia('google-policy')
router.on('download-app').renderInertia('download-app')
router.on('cashback-showdown').renderInertia('cashback-showdown')
router.on('whitelabel').renderInertia('whitelabel')

router.get('webhook/conversion', [WebhookController, 'conversion'])

if (['local', 'staging'].some((environment) => env.get('APP_URL').includes(environment))) {
  router.get('webhook/conversion-old', [WebhookController, 'conversionOld'])
  router.get('env', async ({ response }) => {
    return response.ok({
      APP_URL: env.get('APP_URL'),
      APP_ENV: env.get('APP_ENV'),
      APP_NAME: env.get('APP_NAME'),
      APP_KEY: env.get('APP_KEY'),
    })
  })
}

router
  .group(() => {
    router.on('').redirect('admin.sellers.index').as('admin.redirect')
    router
      .group(() => {
        router.get('', [AdminSellerController, 'index']).as('index')
        router.post('', [AdminSellerController, 'storeOrUpdate']).as('storeOrUpdate')
      })
      .prefix('sellers')
      .as('sellers')

    router
      .group(() => {
        router.get('', [AdminProductController, 'index']).as('index')
        router.post('', [AdminProductController, 'storeOrUpdate']).as('storeOrUpdate')
      })
      .prefix('products')
      .as('products')

    router
      .group(() => {
        router
          .get('', [AdminWithdrawalController, 'index'])
          .as('index')
          .middleware([
            middleware.acl({
              permissions: ['read'],
              target: Withdrawal,
            }),
          ])
        router
          .post('', [AdminWithdrawalController, 'update'])
          .as('update')
          .middleware([
            middleware.acl({
              permissions: ['update'],
              target: Withdrawal,
            }),
          ])
        router
          .get('export', [AdminWithdrawalController, 'export'])
          .as('export')
          .middleware([
            middleware.acl({
              permissions: ['read'],
              target: Withdrawal,
            }),
          ])
      })
      .prefix('withdrawals')
      .as('withdrawals')

    router
      .group(() => {
        router
          .get('', [AdminConversionController, 'index'])
          .as('index')
          .middleware([
            middleware.acl({
              permissions: ['read'],
              target: Conversion,
            }),
          ])
        router
          .post('', [AdminConversionController, 'update'])
          .as('update')
          .middleware([
            middleware.acl({
              permissions: ['update'],
              target: Conversion,
            }),
          ])
      })
      .prefix('conversions')
      .as('conversions')

    router
      .group(() => {
        router.get('', [AdminMissingCashbackController, 'index']).as('index')
        router
          .patch(':id/update', [AdminMissingCashbackController, 'updateMissingCashback'])
          .as('updateMissingCashback')
      })
      .prefix('missing-cashbacks')
      .as('missing-cashbacks')
  })
  .use([middleware.auth({ guards: ['web'] }), middleware.isAdmin()])
  .prefix('admin')
  .as('admin')

router
  .get('/swaggerx', async ({ response }: HttpContext) => {
    // Convert import.meta.url to a usable file path
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const swaggerPath = join(__dirname, '../.../../../swagger.json')
    const swaggerJson = readFileSync(swaggerPath, 'utf-8')

    response.header('Content-Type', 'application/json')
    return JSON.parse(swaggerJson)
  })
  .middleware([middleware.developmentOnly()])

router
  .get('/docs', async ({ view }) => {
    const specUrl = '/swaggerx'
    return view.render('swagger', { specUrl })
  })
  .middleware([middleware.developmentOnly()])

// /download: smart redirect for QR code
const DownloadController = () => import('#controllers/download_controller')
router.get('/download', [DownloadController, 'handle'])

// for any deeplink that starts with /product or /seller
for (const [basePath, path] of Object.entries({
  seller: '/*',
  product: '/*',
  referral: '',
})) {
  router.get(`/${basePath}${path}`, async ({ request, inertia }) => {
    const baseUrl = env.get('APP_BASE_URL')
    const deeplinkUrl = `${baseUrl}${request.url()}`
    const fallbackUrl = '/download-app'

    return inertia.render('deeplink-redirect', { deeplinkUrl, fallbackUrl })
  })
}
