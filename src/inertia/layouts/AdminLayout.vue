<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
} from '@heroicons/vue/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { Link, usePage } from '@inertiajs/vue3'
import { Method } from '@inertiajs/core'
import { SharedProps } from '@adonisjs/inertia/types'
import DarkModeAppLogo from '~/assets/logo.svg'
import AppLogo from '~/assets/logo.svg'
import type User from '#models/user'
import { usePermissions } from '../js/usePermissions'
import FlashMessageHandler from '~/components/FlashMessageHandler.vue'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { useDarkMode } from '../js/useDarkMode'

const url = new URL(window.location.href)
const sourceParam = url.searchParams.get('source')

const { hasPermission, isSuperAdmin } = usePermissions()
const { isDark } = useDarkMode()

const sidebarNavigation = computed(() => {
  const navigation: Record<string, any[]> = {}

  // Finance section - show for finance role or if user has withdrawal/conversion permissions
  if (
    isSuperAdmin() ||
    hasPermission('read', 'Withdrawal') ||
    hasPermission('read', 'Conversion')
  ) {
    navigation.Finance = []

    // Add withdrawals if user has permission
    if (isSuperAdmin() || hasPermission('read', 'Withdrawal')) {
      navigation.Finance.push({
        name: 'Withdrawals',
        href: '/admin/withdrawals',
        icon: BanknotesIcon,
        current: url.pathname === '/admin/withdrawals',
      })
    }

    // Add conversions if user has permission
    if (isSuperAdmin() || hasPermission('read', 'Conversion')) {
      navigation.Finance.push({
        name: 'Conversions',
        href: '/admin/conversions',
        icon: ChartBarIcon,
        current: url.pathname === '/admin/conversions',
      })
    }

    navigation.Finance.push({
      name: 'Missing Cashbacks',
      href: '/admin/missing-cashbacks',
      icon: ExclamationTriangleIcon,
      current: url.pathname === '/admin/missing-cashbacks',
    })
  }

  navigation.Sellers = [
    {
      name: 'Manage (Local)',
      href: '/admin/sellers',
      icon: UserIcon,
      current: url.pathname === '/admin/sellers' && sourceParam !== 'api',
    },
    {
      name: 'Find New (API)',
      href: '/admin/sellers?source=api',
      icon: MagnifyingGlassIcon,
      current: url.pathname === '/admin/sellers' && sourceParam === 'api',
    },
  ]

  navigation.Products = [
    {
      name: 'Manage (Local)',
      href: '/admin/products',
      icon: ShoppingBagIcon,
      current: url.pathname === '/admin/products' && sourceParam !== 'api',
    },

    {
      name: 'Find New (API)',
      href: '/admin/products?source=api',
      icon: MagnifyingGlassIcon,
      current: url.pathname === '/admin/products' && sourceParam === 'api',
    },
  ]

  return navigation
})

const userNavigation = [{ name: 'Sign out', href: '/auth/logout', method: 'post' }]

const sidebarOpen = ref(false)
const page = usePage<SharedProps>()
const user = ref(page.props.user) as User
</script>

<template>
  <div>
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="size-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>
              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div
                class="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4"
              >
                <div class="flex h-16 shrink-0 items-center">
                  <Link :href="'/admin/sellers'">
                    <div class="flex items-center gap-2">
                      <img
                        :src="isDark ? DarkModeAppLogo : AppLogo"
                        alt="Cashiu"
                        class="size-32"
                      />
                    </div>
                  </Link>
                </div>
                <nav class="flex flex-1 flex-col">
                  <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li v-for="(section, sectionName) in sidebarNavigation" :key="sectionName">
                      <div class="text-xs/6 font-semibold text-gray-400 dark:text-gray-100">
                        {{ sectionName }}
                      </div>
                      <ul role="list" class="-mx-2 mt-2 space-y-1">
                        <li v-for="item in section" :key="item.name">
                          <Link
                            :href="item.href"
                            :class="[
                              item.current
                                ? 'bg-primary-600 dark:bg-primary-600 text-white dark:text-white font-bold'
                                : 'text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-white font-normal',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6',
                            ]"
                          >
                            <component
                              :is="item.icon"
                              :class="[
                                item.current
                                  ? 'text-white dark:text-white font-bold'
                                  : 'text-gray-400 dark:text-gray-100 group-hover:text-white dark:group-hover:text-white font-normal',
                                'size-6 shrink-0',
                              ]"
                              aria-hidden="true"
                            />
                            {{ item.name }}
                          </Link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div
        class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 px-6 pb-4"
      >
        <div class="flex h-16 shrink-0 items-center">
          <Link :href="'/admin/sellers'">
            <div class="flex items-center gap-2">
              <img :src="isDark ? DarkModeAppLogo : AppLogo" alt="Cashiu" class="size-32" />
            </div>
          </Link>
        </div>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li v-for="(section, sectionName) in sidebarNavigation" :key="sectionName">
              <div class="text-xs/6 font-semibold text-gray-400 dark:text-gray-100">
                {{ sectionName }}
              </div>
              <ul role="list" class="-mx-2 mt-2 space-y-1">
                <li v-for="item in section" :key="item.name">
                  <Link
                    :href="item.href"
                    :class="[
                      item.current
                        ? 'bg-primary-600 dark:bg-primary-600 text-white dark:text-white font-bold'
                        : 'text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-white font-normal',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6',
                    ]"
                  >
                    <component
                      :is="item.icon"
                      :class="[
                        item.current
                          ? 'text-white dark:text-white font-bold'
                          : 'text-gray-400 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-white font-normal',
                        'size-6 shrink-0',
                      ]"
                      aria-hidden="true"
                    />
                    {{ item.name }}
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="lg:pl-72">
      <div
        class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
      >
        <button
          type="button"
          class="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
          @click="sidebarOpen = true"
        >
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon class="size-6" aria-hidden="true" />
        </button>

        <!-- Separator -->
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex flex-1"></div>
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <!-- Theme toggle -->
            <Menu as="div" class="relative">
              <MenuButton class="flex items-center p-1.5">
                <ThemeToggle />
              </MenuButton>
            </Menu>

            <!-- Profile dropdown -->
            <Menu as="div" class="relative">
              <MenuButton class="-m-1.5 flex items-center p-1.5">
                <span class="sr-only">Open user menu</span>
                <div class="flex items-center">
                  <div
                    class="size-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <img
                      :src="
                        user.avatar ||
                        'https://ui-avatars.com/api/?name=' + user.name + '&background=random'
                      "
                      loading="lazy"
                      alt="User Avatar"
                      class="size-8 rounded-full"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </MenuButton>
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-700/5 focus:outline-none"
                >
                  <MenuItem v-for="item in userNavigation" :key="item.name" v-slot="{ active }">
                    <Link
                      :href="item.href"
                      :method="item.method as Method"
                      :class="[
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100',
                      ]"
                    >
                      {{ item.name }}
                    </Link>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>

      <main class="py-5 bg-white dark:bg-gray-900 min-h-screen">
        <div class="px-5">
          <slot />
        </div>
      </main>
    </div>

    <!-- Global flash message handler -->
    <FlashMessageHandler />
  </div>
</template>
