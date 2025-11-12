<template>
  <tr>
    <td :colspan="colspan" class="px-6 py-12 text-center">
      <div class="flex flex-col items-center justify-center space-y-4">
        <!-- Custom empty icon or default -->
        <slot name="icon">
          <svg
            class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </slot>
        
        <!-- Empty message -->
        <div class="text-center">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ title }}
          </h3>
          <p v-if="description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ description }}
          </p>
        </div>
        
        <!-- Action button if provided -->
        <div v-if="$slots.action" class="mt-6">
          <slot name="action" />
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
interface Props {
  colspan: number
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: 'No data available',
  description: ''
})
</script>
