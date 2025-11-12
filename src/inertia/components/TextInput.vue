<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Label from '~/components/Label.vue'

const model = defineModel({
  type: String,
  required: false,
})

const props = defineProps({
  label: {
    type: String,
    required: false,
    default: '',
  },
  placeholder: {
    type: String,
    required: false,
    default: '',
  },
})

const input = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (input.value && input.value.hasAttribute('autofocus')) {
    input.value.focus()
  }
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div>
    <Label :label="props.label" />
    <div>
      <input
        class="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-100 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
        v-model="model"
        ref="input"
        :placeholder="props.placeholder"
      />
    </div>
  </div>
</template>
