<template>
  <div>
    <dl class="my-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div
        v-for="item in stats"
        :key="item.name"
        class="overflow-hidden rounded-lg px-4 py-5 border border-gray-200 shadow sm:p-6"
      >
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ item.name }}</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{{ item.stat }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    name: string
    stat: string
  }[]
}>()
</script>
