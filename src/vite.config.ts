import inertia from '@adonisjs/inertia/client'
import adonisjs from '@adonisjs/vite/client'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: ['resources/css/app.css', 'resources/js/app.js'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],

      assetsUrl: '/assets',
    }),
    inertia({ ssr: { enabled: false } }),
    vue(),
    adonisjs({ entrypoints: ['inertia/app/app.ts'], reload: ['resources/views/**/*.edge'] }),
  ],
  server: {
    allowedHosts: ['local.appchaching.com'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./inertia', import.meta.url)) // Alias for src folder
    }
  }
})
