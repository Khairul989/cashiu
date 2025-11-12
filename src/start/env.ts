/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'
import app from '@adonisjs/core/services/app'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string({ format: 'url', tld: app.inProduction }),
  IA_EXTERNAL_API_URL: Env.schema.string.optional(),
  APP_NAME: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  ENABLE_EMAIL_PASSWORD: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'redis', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string(),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  DB_DEBUG: Env.schema.boolean(),

  REDIS_HOST: Env.schema.string(),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_DB: Env.schema.number(),

  RATE_LIMITER_REDIS_HOST: Env.schema.string(),
  RATE_LIMITER_REDIS_PORT: Env.schema.number(),
  RATE_LIMITER_REDIS_PASSWORD: Env.schema.string.optional(),
  RATE_LIMITER_REDIS_DB: Env.schema.number(),

  CACHE_DRIVER: Env.schema.enum(['redis', 'memory'] as const),
  CACHE_REDIS_HOST: Env.schema.string(),
  CACHE_REDIS_PORT: Env.schema.number(),
  CACHE_REDIS_PASSWORD: Env.schema.string.optional(),
  CACHE_REDIS_DB: Env.schema.number(),

  /*
  |----------------------------------------------------------
  | Variables for configuring bullmq queue
  |----------------------------------------------------------
  */
  BULL_REDIS_HOST: Env.schema.string(),
  BULL_REDIS_PORT: Env.schema.number(),
  BULL_REDIS_PASSWORD: Env.schema.string.optional(),
  BULL_REDIS_DB: Env.schema.number(),

  /*
  |----------------------------------------------------------
  | Variables for configuring ally package
  |----------------------------------------------------------
  */
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),
  GOOGLE_CALLBACK_URL: Env.schema.string.optional(),

  APPLE_CLIENT_ID: Env.schema.string.optional(),
  APPLE_TEAM_ID: Env.schema.string.optional(),
  APPLE_KEY_ID: Env.schema.string.optional(),
  APPLE_CALLBACK_URL: Env.schema.string.optional(),
  APPLE_PRIVATE_KEY: Env.schema.string.optional(), // base64 encoded private key

  /*
  |----------------------------------------------------------
  | Variables for configuring sentry package
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string.optional(),
  SENTRY_TRACES_SAMPLE_RATE: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring firebase notification
  |----------------------------------------------------------
  */
  FIREBASE_CLIENT_ID: Env.schema.string.optional(),
  FIREBASE_PROJECT_ID: Env.schema.string.optional(),
  FIREBASE_PRIVATE_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the shopee graphql client
  |----------------------------------------------------------
  */
  SHOPEE_MY_GRAPHQL_APP_ID: Env.schema.string.optional(),
  SHOPEE_MY_GRAPHQL_APP_SECRET: Env.schema.string.optional(),

  HOMEPAGE_SHOP_LIMIT: Env.schema.number(),

  CONV_TRACKED_DAYS: Env.schema.number.optional(),
  CONV_PAYMENT_DAYS: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  MAIL_HOST: Env.schema.string(),
  MAIL_PORT: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  MAIL_FROM_NAME: Env.schema.string(),

  FINANCE_EMAIL_ADDRESS: Env.schema.string(),
  FEEDBACK_EMAIL_ADDRESS: Env.schema.string(),

  IA_API_KEY: Env.schema.string.optional(),
  IA_API_SECRET: Env.schema.string.optional(),

  NON_AMS_PRODUCT_COMMISSION_RATE: Env.schema.number.optional(),

  CF_ACCESS_CLIENT_ID: Env.schema.string.optional(),
  CF_ACCESS_CLIENT_SECRET: Env.schema.string.optional(),
})
