<script setup lang="ts">
defineProps({
  disabled: { type: Boolean, default: false },
  color: { type: String, default: 'secondary' },
})
</script>

<template>
  <button
    :class="[
      disabled ? 'cursor-not-allowed opacity-50' : '',
      `inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest transition duration-150 ease-in-out focus:outline-none focus:ring-2  focus:ring-offset-2`,
      color === 'primary'
        ? 'bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:bg-primary-700'
        : '',
      color === 'danger' ? 'bg-red-600 hover:bg-red-500 focus:bg-red-500' : '',
      color === 'success' ? 'bg-green-600 hover:bg-green-500 focus:bg-green-500' : '',
      color === 'warning' ? 'bg-yellow-600 hover:bg-yellow-500 focus:bg-yellow-500' : '',
      color === 'secondary'
        ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:bg-gray-300 dark:focus:bg-gray-600'
        : '',
      color === 'secondary' ? 'text-gray-800 dark:text-gray-200' : 'text-white',
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
