<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Label from '~/components/Label.vue'

defineOptions({
  inheritAttrs: false,
})

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
  rows: {
    type: Number,
    required: false,
    default: 4,
  },
})

const textarea = ref<HTMLTextAreaElement | null>(null)

onMounted(() => {
  if (textarea.value && textarea.value.hasAttribute('autofocus')) {
    textarea.value.focus()
  }
})

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div>
    <Label :label="props.label" />
    <div>
      <textarea
        class="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-base text-gray-900 dark:text-gray-100 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6 resize-vertical"
        v-model="model"
        ref="textarea"
        :placeholder="props.placeholder"
        :rows="props.rows"
        v-bind="$attrs"
      />
    </div>
  </div>
</template> 