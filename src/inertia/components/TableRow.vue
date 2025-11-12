<template>
  <tr
    :class="[
      'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150',
      selected ? 'bg-blue-50 dark:bg-blue-900/20' : '',
      disabled ? 'opacity-50' : '',
      customClass,
    ]"
  >
    <!-- Selection column if enabled -->
    <td v-if="selectable" class="relative py-4 pl-3 pr-4 sm:pr-6">
      <slot name="select-cell">
        <Checkbox
          :checked="selected"
          :disabled="disabled || selectDisabled"
          @change="$emit('select-change', $event)"
        />
      </slot>
    </td>

    <!-- Dynamic cells based on headers -->
    <td
      v-for="(header, index) in headers"
      :key="header.value"
      :class="[
        'whitespace-nowrap px-3 py-4 text-sm',
        getCellAlignment(header),
        getCellTextColor(header),
        header.width ? header.width : '',
      ]"
    >
      <slot :name="`cell-${header.value}`" :header="header" :index="index" :data="data">
        <!-- Default cell content -->
        <span v-if="data && data[header.value] !== undefined">
          {{ formatCellValue(data[header.value], header) }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-500">-</span>
      </slot>
    </td>

    <!-- Actions column if enabled -->
    <td v-if="showActions" class="relative py-4 px-3 text-left">
      <slot name="actions" :data="data">
        <!-- Default actions content -->
      </slot>
    </td>
  </tr>
</template>

<script setup lang="ts">
import Checkbox from './Checkbox.vue'

interface TableHeader {
  name: string
  value: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom'
  format?: string
}

interface Props {
  headers: TableHeader[]
  data: Record<string, any>
  selectable?: boolean
  selectDisabled?: boolean
  showActions?: boolean
  selected?: boolean
  disabled?: boolean
  customClass?: string
}

interface Emits {
  (e: 'select-change', event: Event): void
  (e: 'click', data: Record<string, any>): void
}

withDefaults(defineProps<Props>(), {
  selectable: false,
  selectDisabled: false,
  showActions: false,
  selected: false,
  disabled: false,
  customClass: '',
})

defineEmits<Emits>()

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

const getCellTextColor = (header: TableHeader): string => {
  if (header.type === 'number' || header.type === 'currency') {
    return 'text-gray-900 dark:text-gray-100 font-medium'
  }
  return 'text-gray-500 dark:text-gray-300'
}

const formatCellValue = (value: any, header: TableHeader): string => {
  if (value === null || value === undefined) return '-'

  switch (header.type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value.toString()
    case 'currency':
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-MY', {
          style: 'currency',
          currency: 'MYR',
          minimumFractionDigits: 2,
        }).format(value)
      }
      return value.toString()
    case 'boolean':
      return value ? 'Yes' : 'No'
    default:
      return value.toString()
  }
}
</script>
