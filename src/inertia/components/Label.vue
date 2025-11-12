<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: false,
    default: '',
  },
  isActive: {
    type: Boolean,
    required: false,
    default: false,
  },
})
</script>

<template>
  <label
    v-if="props.label.length > 0"
    class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
    :class="{ '!text-primary-700': isActive }"
  >
    {{ props.label }}
  </label>
</template>
