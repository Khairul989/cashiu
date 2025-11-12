import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'
import { InferConnections } from '@adonisjs/redis/types'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | The default connection
    |--------------------------------------------------------------------------
    |
    | The main connection you want to use to execute redis commands. The same
    | connection will be used by the session provider, if you rely on the
    | redis driver.
    |
    */
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_DB', 0),
      keyPrefix: '',
      retryStrategy(times) {
        return times > 10 ? null : times * 50
      },
    },
    limiter: {
      host: env.get('RATE_LIMITER_REDIS_HOST'),
      port: env.get('RATE_LIMITER_REDIS_PORT'),
      password: env.get('RATE_LIMITER_REDIS_PASSWORD', ''),
      db: env.get('RATE_LIMITER_REDIS_DB', 0),
      keyPrefix: 'limiter',
      retryStrategy(times) {
        return times > 10 ? null : times * 50
      },
    },
    cache: {
      host: env.get('CACHE_REDIS_HOST'),
      port: env.get('CACHE_REDIS_PORT'),
      password: env.get('CACHE_REDIS_PASSWORD', ''),
      db: env.get('CACHE_REDIS_DB', 4),
      keyPrefix: 'cache',
      retryStrategy(times) {
        return times > 10 ? null : times * 50
      },
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
