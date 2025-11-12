import env from '#start/env'
import { defineConfig, drivers, store } from '@adonisjs/cache'

const cacheConfig = defineConfig({
  default: env.get('CACHE_DRIVER', 'redis'),

  stores: {
    memory: store().useL1Layer(drivers.memory()),

    redis: store()
      .useL1Layer(drivers.memory())
      .useL2Layer(
        drivers.redis({
          connectionName: 'cache',
        })
      ),
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
