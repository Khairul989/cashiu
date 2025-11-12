/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp } from '@inertiajs/vue3'
import type { DefineComponent } from 'vue'
import { createApp, h } from 'vue'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import '../css/app.css'
import { permissionDirective } from '../js/permissionDirective.js'

// Initialize dark mode on app start
const initializeDarkMode = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
    return
  }
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
}

// Initialize dark mode immediately
initializeDarkMode()

// @ts-ignore
const appName = import.meta.env.VITE_APP_NAME || 'Cashiu!'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title: string) => `${title}`,

  resolve: (name: string) => {
    return resolvePageComponent(
      `../pages/${name}.vue`,
      // @ts-ignore
      import.meta.glob<DefineComponent>('../pages/**/*.vue')
    )
  },

  // @ts-ignore
  setup({ el, App, props, plugin }) {
    const app = createApp({ render: () => h(App, props) })

    app.use(plugin)
    app.use(Vue3Toastify, {
      autoClose: 3000,
    } as ToastContainerOptions)

    // Register permission directive globally
    app.directive('permission', permissionDirective)

    app.mount(el)
  },
})
