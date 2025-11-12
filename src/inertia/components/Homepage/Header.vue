<script setup lang="ts">
import type User from '#models/user'
import { SharedProps } from '@adonisjs/inertia/types'
import { Link, usePage } from '@inertiajs/vue3'
import AppLogo from '~/assets/logo.svg'

const page = usePage<SharedProps>()
const user = page.props?.user as User | undefined
</script>

<template>
  <header class="sticky top-0 left-0 w-full z-30" style="height:84px;">
    <div class="absolute inset-0 w-full h-full bg-white/40 backdrop-blur-md" style="z-index:-1;backdrop-filter:blur(16px);"></div>
    <div class="flex justify-between items-center max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16" style="height:84px;padding-top:20px;padding-bottom:20px;">
      <Link :href="'/'">
      <div class="flex items-center gap-2">
        <img :src="AppLogo" alt="Cashiu" class="h-10 w-5" />
        <span class="text-base font-bold sm:text-2xl text-primary-700"> Cashiu! </span>
      </div>
      </Link>
      <div class="flex items-center gap-4">
        <Link v-if="user && user.isAdmin" :href="'/admin/sellers'"
          class="text-xs lg:text-sm font-medium text-primary-700 rounded-[1.25rem] px-8 py-2 bg-white">
        Admin Dashboard
        </Link>
        <Link :href="'/download-app'"
          class="text-xs lg:text-sm font-medium text-white rounded-[1.25rem] px-8 py-2 bg-primary-700">
        Download App
        </Link>
      </div>
    </div>
  </header>
</template>
