<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

// Primary model (v-model)
const model = defineModel<boolean | undefined>({
  type: Boolean,
  required: false,
  default: undefined,
})

interface Props {
  checked?: boolean
  disabled?: boolean
  id?: string
  name?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
  wrapperClass?: string
  inputClass?: string
  svgClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  checked: undefined,
  disabled: false,
  id: undefined,
  name: undefined,
  ariaLabel: undefined,
  ariaDescribedBy: undefined,
  indeterminate: false,
  size: 'md',
  wrapperClass: '',
  inputClass: '',
  svgClass: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:checked', value: boolean): void
  (e: 'change', event: Event): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const isChecked = computed<boolean>(() => {
  if (model.value !== undefined) return Boolean(model.value)
  if (props.checked !== undefined) return Boolean(props.checked)
  return false
})

const wrapperSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-5'
    case 'lg':
      return 'h-7'
    default:
      return 'h-6'
  }
})

const gridSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-3.5'
    case 'lg':
      return 'size-5'
    default:
      return 'size-4'
  }
})

const checkIconSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-3'
    case 'lg':
      return 'size-4'
    default:
      return 'size-3.5'
  }
})

const onChange = (event: Event) => {
  const next = (event.target as HTMLInputElement)?.checked ?? false
  emit('update:modelValue', next)
  emit('update:checked', next)
  emit('change', event)
}

const syncIndeterminate = () => {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate
  }
}

onMounted(syncIndeterminate)
watch(() => props.indeterminate, syncIndeterminate)
</script>

<template>
  <div class="flex shrink-0 items-center" :class="[wrapperSizeClass, props.wrapperClass]">
    <div class="group grid grid-cols-1" :class="[gridSizeClass]">
      <input
        ref="inputRef"
        :id="props.id"
        :aria-label="props.ariaLabel"
        :aria-describedby="props.ariaDescribedBy"
        :name="props.name"
        type="checkbox"
        :checked="isChecked"
        :disabled="props.disabled"
        @change="onChange"
        class="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 indeterminate:border-primary-600 indeterminate:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-primary-500 dark:checked:bg-primary-500 dark:indeterminate:border-primary-500 dark:indeterminate:bg-primary-500 dark:focus-visible:outline-primary-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
        :class="props.inputClass"
        v-bind="$attrs"
      />
      <svg
        class="pointer-events-none col-start-1 row-start-1 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25 dark:group-has-[:disabled]:stroke-white/25"
        :class="[checkIconSizeClass, props.svgClass]"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          class="opacity-0 group-has-[:checked]:opacity-100"
          d="M3 8L6 11L11 3.5"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          class="opacity-0 group-has-[:indeterminate]:opacity-100"
          d="M3 7H11"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>
