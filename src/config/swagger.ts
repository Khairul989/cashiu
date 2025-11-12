// for AdonisJS v6
import app from '@adonisjs/core/services/app'
import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'Cashback App', // use info instead
  version: '1.0.0', // use info instead
  description: '', // use info instead
  tagIndex: 1,
  info: {
    title: 'Cashback App',
    version: '1.0.0',
    description: 'Get Cashback from Shopee MY',
  },
  snakeCase: true,
  debug: !app.inProduction,
  ignore: [
    '/',
    '/swaggerx',
    '/docs',
    '/privacy-policy',
    '/terms-of-use',
    '/cashback-showdown',
    '/google-data-deletion-policy',
    '/download-app',
    '/download',
    '/deeplink-redirect',
    '/auth/authorize',
    '/auth/login',
    '/auth/logout',
    '/auth/social/*',
    '/webhook/*',
    '/admin/*',
    '/admin',
    '/seller/*',
    '/product/*',
    '/referral',
    '/env'
  ],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {
      limiter: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number', example: 1 },
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number', example: 10 },
        },
      ],
    },
    headers: {},
  },
  securitySchemes: {
    BasicAuth: {},
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'api-key',
    },
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  }, // optional
  authMiddlewares: ['api'], // optional
  defaultSecurityScheme: 'ApiKeyAuth', // optional
  persistAuthorization: true, // persist authorization between reloads on the swagger page
  showFullPath: false, // the path displayed after endpoint summary
}
