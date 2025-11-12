<template>
  <div class="flex items-center justify-center py-4">
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-300" v-if="paginations.total > 0">
          Showing
          {{ ' ' }}
          <span class="font-medium">{{
            paginations.currentPage * paginations.perPage - paginations.perPage + 1
          }}</span>
          {{ ' ' }}
          to
          {{ ' ' }}
          <span class="font-medium">{{
            paginations.currentPage === paginations.lastPage
              ? paginations.total
              : paginations.currentPage * paginations.perPage
          }}</span>
          {{ ' ' }}
          of
          {{ ' ' }}
          <span class="font-medium">{{ paginations.total }}</span>
          {{ ' ' }}
          results
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300" v-else>No results found</p>
      </div>
    </div>
    <nav class="flex items-center space-x-1" aria-label="Pagination">
      <!-- Previous Button -->
      <button
        @click.prevent="changePage(paginations.currentPage - 1)"
        :disabled="!paginations.previousPageUrl"
        class="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
      </button>

      <!-- Pagination Numbers -->
      <template v-for="page in paginationNumbers" :key="page">
        <button
          v-if="page === '...'"
          disabled
          class="flex h-9 w-9 items-center justify-center text-gray-500"
        >
          {{ page }}
        </button>
        <button
          v-else
          @click.prevent="goToPage(Number(page))"
          :class="[
            'flex h-9 w-fit px-3 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium',
            page === paginations.currentPage
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next Button -->
      <button
        @click.prevent="changePage(paginations.currentPage + 1)"
        :disabled="!paginations.nextPageUrl"
        class="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import { PropType, computed } from 'vue'

export interface PaginationInterface {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string | null
  lastPageUrl: string | null
  nextPageUrl: string | null
  previousPageUrl: string | null
}

const props = defineProps({
  paginations: {
    type: Object as PropType<PaginationInterface>,
    required: true,
  },
})

const emit = defineEmits(['changePage'])

const paginationNumbers = computed(() => {
  const range = []
  const delta = 2
  const { currentPage, lastPage } = props.paginations

  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }
  return range
})

const goToPage = (page: number) => {
  if (page !== props.paginations.currentPage) {
    emit('changePage', page)
  }
}

const changePage = (url: number) => {
  if (url) {
    emit('changePage', url)
  }
}
</script>

<style scoped>
/* Additional styles for hover and focus states if needed */
</style>
