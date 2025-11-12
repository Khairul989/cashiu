<template>
  <div class="flex items-center justify-center py-4">
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-100" v-if="paginations.total > 0">
          Showing
          <span class="font-medium">{{ paginations.total }}</span>
          items
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-100" v-else>No results found</p>
      </div>
    </div>
    <nav class="flex items-center space-x-1" aria-label="Pagination">
      <!-- Previous Button -->
      <button
        @click.prevent="changePage(paginations.page - 1)"
        :disabled="paginations.page === 1"
        class="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
      </button>

      <!-- Next Button -->
      <button
        @click.prevent="changePage(paginations.page + 1)"
        :disabled="!paginations.hasNextPage"
        class="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import { PropType } from 'vue'

export interface SimplePaginationInterface {
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

defineProps({
  paginations: {
    type: Object as PropType<SimplePaginationInterface>,
    required: true,
  },
})

const emit = defineEmits(['changePage'])

const changePage = (url: number) => {
  if (url) {
    emit('changePage', url)
  }
}
</script>
