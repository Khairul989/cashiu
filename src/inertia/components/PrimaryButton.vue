<script setup lang="ts">
defineProps({
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button
    :class="[
      disabled ? 'cursor-not-allowed opacity-50' : '',
      'inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-primary-700 focus:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 active:bg-gray-900',
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
