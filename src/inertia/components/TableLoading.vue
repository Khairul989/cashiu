<template>
  <tr v-for="index in rows" :key="index">
    <!-- Selection column if enabled -->
    <td v-if="selectable" class="relative py-4 pl-3 pr-4 sm:pr-6">
      <div class="animate-pulse">
        <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </td>
    
    <!-- Loading cells based on headers -->
    <td
      v-for="header in headers"
      :key="header.value"
      :class="[
        'px-3 py-4',
        getCellAlignment(header)
      ]"
    >
      <div class="animate-pulse">
        <div 
          :class="[
            'h-4 bg-gray-200 dark:bg-gray-700 rounded',
            getLoadingWidth(header)
          ]"
        ></div>
      </div>
    </td>
    
    <!-- Actions column if enabled -->
    <td v-if="showActions" class="relative py-4 px-3 text-right">
      <div class="animate-pulse">
        <div class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
interface TableHeader {
  name: string
  value: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface Props {
  headers: TableHeader[]
  rows?: number
  selectable?: boolean
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  selectable: false,
  showActions: false
})

const getCellAlignment = (header: TableHeader): string => {
  switch (header.align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

const getLoadingWidth = (header: TableHeader): string => {
  // Provide different loading widths based on content type
  if (header.value.includes('name') || header.value.includes('title')) {
    return 'w-32' // Wider for text content
  }
  if (header.value.includes('date') || header.value.includes('time')) {
    return 'w-24' // Medium for dates
  }
  if (header.value.includes('status') || header.value.includes('action')) {
    return 'w-20' // Narrower for status/actions
  }
  return 'w-20' // Default width
}
</script>
