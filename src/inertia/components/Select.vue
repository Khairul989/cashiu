<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { ChevronUpDownIcon } from '@heroicons/vue/16/solid'
import { CheckIcon } from '@heroicons/vue/20/solid'
import Label from '~/components/Label.vue'
import { computed, ref } from 'vue'

type GenericItem = Record<string, any>

const props = defineProps({
  label: {
    type: String,
    required: false,
    default: '',
  },
  items: {
    type: Array as () => GenericItem[],
    required: true,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  optionLabel: {
    // key to read for label OR a function that maps item -> string
    type: [String, Function] as unknown as () => string | ((item: GenericItem) => string),
    required: false,
    default: 'name',
  },
  trackBy: {
    // key used for comparing and keys
    type: String,
    required: false,
    default: 'id',
  },
  placeholder: {
    type: String,
    required: false,
    default: 'Select...'
  }
})

const model = defineModel<GenericItem | null | undefined>({
  required: false,
})

const isActive = computed(() => Boolean(model.value))

const containerRef = ref<HTMLElement | null>(null)
const openUpwards = ref(false)
const MAX_MENU_HEIGHT_PX = 240 // Tailwind max-h-60

const evaluatePlacement = () => {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  openUpwards.value = spaceBelow < MAX_MENU_HEIGHT_PX && spaceAbove > spaceBelow
}

const getItemLabel = (item?: GenericItem | null) => {
  if (!item) return ''
  const labeler = props.optionLabel as string | ((i: GenericItem) => string)
  if (typeof labeler === 'function') return labeler(item)
  const value = item[labeler]
  return typeof value === 'string' ? value : String(value ?? '')
}

const buttonText = computed(() => {
  return model.value ? getItemLabel(model.value) : props.placeholder
})
</script>

<template>
  <Listbox as="div" v-model="model" :by="trackBy">
    <Label :label="props.label" :is-active="isActive" />
    <div class="relative" ref="containerRef">
      <ListboxButton
        class="grid w-full cursor-default grid-cols-1 rounded-md bg-white dark:bg-gray-700 py-2 pl-3 pr-2 text-left text-gray-900 dark:text-gray-100 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
        :disabled="disabled"
        :class="{
          'opacity-50 bg-gray-500 cursor-not-allowed': disabled,
        }"
        @click="evaluatePlacement"
      >
        <span class="col-start-1 row-start-1 truncate pr-6">{{ buttonText }}</span>
        <ChevronUpDownIcon
          class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          aria-hidden="true"
        />
      </ListboxButton>

      <transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-50 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
          :class="openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'"
        >
          <ListboxOption
            as="template"
            v-for="item in props.items"
            :key="(item?.[trackBy] ?? getItemLabel(item))?.toString()"
            :value="item"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                active ? 'bg-primary-600 text-white outline-none' : 'text-gray-900 dark:text-gray-100',
                'relative cursor-default select-none py-2 pl-3 pr-9',
              ]"
            >
              <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{
                getItemLabel(item)
              }}</span>

              <span
                v-if="selected"
                :class="[
                  active ? 'text-white' : 'text-primary-600',
                  'absolute inset-y-0 right-0 flex items-center pr-4',
                ]"
              >
                <CheckIcon class="size-5" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
