<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: String,
    default: '2xl',
  },
  closeable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const close = () => {
  if (props.closeable) {
    emit('close')
  }
}

const closeOnEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    close()
  }
}

onMounted(() => document.addEventListener('keydown', closeOnEscape))

onUnmounted(() => document.removeEventListener('keydown', closeOnEscape))
</script>

<template>
  <div v-show="show" class="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 transform transition-all" @click="close">
      <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
    </div>

    <div class="relative bg-white dark:bg-gray-800 rounded-lg overflow-visible shadow-xl transform transition-all sm:w-full sm:mx-auto" :class="{
      'sm:max-w-sm': maxWidth === 'sm',
      'sm:max-w-md': maxWidth === 'md',
      'sm:max-w-lg': maxWidth === 'lg',
      'sm:max-w-2xl': maxWidth === '2xl',
      'sm:max-w-4xl': maxWidth === '4xl',
      'sm:max-w-5xl': maxWidth === '5xl',
      'sm:max-w-7xl': maxWidth === '7xl',
    }">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            <slot name="title" />
          </h3>
          <button
            v-if="closeable"
            @click="close"
            class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
          >
            <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="px-6 pb-6">
        <slot />
      </div>
    </div>
  </div>
</template> 