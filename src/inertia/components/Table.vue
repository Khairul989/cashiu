<template>
  <div class="w-full">
    <div class="mt-8 flow-root">
      <div
        class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-opacity-10 dark:ring-white sm:rounded-lg h-fit"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <!-- Selection column if enabled -->
                <th v-if="selectable" scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <slot name="select-header">
                    <Checkbox
                      :checked="selectAll"
                      :disabled="!canSelectAll"
                      @change="$emit('select-all-change', $event)"
                    />
                  </slot>
                </th>

                <!-- Dynamic headers -->
                <th
                  v-for="header in headers"
                  :key="header.value"
                  scope="col"
                  :class="[
                    'px-3 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100',
                    getHeaderAlignment(header),
                    header.sortable
                      ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none'
                      : '',
                  ]"
                  @click="header.sortable ? handleSort(header) : null"
                >
                  <div :class="['flex items-center gap-1', getHeaderContentAlignment(header)]">
                    <span>{{ header.name }}</span>

                    <!-- Sort indicators -->
                    <div v-if="header.sortable" class="flex flex-col">
                      <slot name="sort-indicator" :header="header" :current-sort="currentSort">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="size-3"
                          :class="{
                            'text-primary-600':
                              currentSort?.by === header.value && currentSort?.order === 'asc',
                            'text-gray-400':
                              currentSort?.by !== header.value || currentSort?.order !== 'asc',
                          }"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="size-3 -mt-1"
                          :class="{
                            'text-primary-600':
                              currentSort?.by === header.value && currentSort?.order === 'desc',
                            'text-gray-400':
                              currentSort?.by !== header.value || currentSort?.order !== 'desc',
                          }"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </slot>
                    </div>

                    <!-- Custom header content -->
                    <slot :name="`header-${header.value}`" :header="header">
                      <!-- Default header content -->
                    </slot>
                  </div>
                </th>

                <!-- Actions column if enabled -->
                <th v-if="showActions" scope="col" class="relative py-3.5 px-3 text-left">
                  <slot name="actions-header">
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >Actions</span
                    >
                  </slot>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <slot
                name="body"
                :headers="headers"
                :selectable="selectable"
                :show-actions="showActions"
              >
                <!-- Default body content -->
              </slot>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Checkbox from './Checkbox.vue'

export interface TableHeader {
  name: string
  value: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface SortState {
  by: string
  order: 'asc' | 'desc'
}

interface Props {
  headers: TableHeader[]
  selectable?: boolean
  showActions?: boolean
  canSelectAll?: boolean
  selectAll?: boolean
  currentSort?: SortState
  emptyMessage?: string
  loading?: boolean
}

interface Emits {
  (e: 'sort', header: TableHeader): void
  (e: 'select-all-change', event: Event): void
}

withDefaults(defineProps<Props>(), {
  selectable: false,
  showActions: false,
  canSelectAll: true,
  selectAll: false,
  emptyMessage: 'No data available',
  loading: false,
})

const emit = defineEmits<Emits>()

const handleSort = (header: TableHeader) => {
  if (header.sortable) {
    emit('sort', header)
  }
}

const getHeaderAlignment = (header: TableHeader): string => {
  switch (header.align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

const getHeaderContentAlignment = (header: TableHeader): string => {
  switch (header.align) {
    case 'center':
      return 'justify-center'
    case 'right':
      return 'justify-end'
    default:
      return 'justify-start'
  }
}
</script>
