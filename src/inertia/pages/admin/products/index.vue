<script setup lang="ts">
import AdminLayout from '~/layouts/AdminLayout.vue'
import TextInput from '~/components/TextInput.vue'
import { Head, router } from '@inertiajs/vue3'
import { computed, ref, toRaw, watch, nextTick } from 'vue'
import { default as Table } from '~/components/Table.vue'
import { default as TableRow } from '~/components/TableRow.vue'
import TableEmpty from '~/components/TableEmpty.vue'
import TableLoading from '~/components/TableLoading.vue'
import Pagination, { PaginationInterface } from '~/components/Pagination.vue'
import SimplePagination, { SimplePaginationInterface } from '~/components/SimplePagination.vue'
import ToggleWithIcon from '~/components/ToggleWithIcon.vue'
import axios from 'axios'
import Modal from '~/components/Modal.vue'
import Button from '~/components/Button.vue'
import { floorDecimalPoints } from '#helpers/number_helper'
import Select from '~/components/Select.vue'

const props = defineProps({
  products: {
    type: Object as () => {
      data: Array<any>
      meta: PaginationInterface | SimplePaginationInterface
    },
    required: true,
  },
  headers: {
    type: Array<{
      name: string
      value: string
      sortable: boolean
    }>,
    required: true,
  },
  search: { type: String, required: false, default: '' },
  source: { type: String, required: false, default: 'db' },
  featured: { type: String, required: false, default: null },
  page: { type: Number, required: false, default: 1 },
  limit: { type: Number, required: false, default: 25 },
  sortBy: { type: String, required: false, default: 'id' },
  sortOrder: { type: String, required: false, default: 'asc' },
})

const loading = ref(false)

const enhancedHeaders = computed(() => {
  return props.headers.map((header) => {
    const baseHeader = {
      name: header.name,
      value: header.value,
      sortable: header.sortable,
      align: 'left' as const,
    }

    switch (header.value) {
      case 'name':
        return { ...baseHeader, align: 'left' as const, width: 'w-[28rem]' }
      case 'cashback':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'rating':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'sales':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'featured':
        return { ...baseHeader, align: 'center' as const, type: 'boolean' as const }
      default:
        return baseHeader
    }
  })
})

const sourceSelections = [
  { name: 'Database', value: 'db' },
  { name: 'Shopee API', value: 'api' },
]

const featuredSelections = [
  { name: 'Featured', value: 'true' },
  { name: 'Not featured', value: 'false' },
]

const searchQuery = ref(props.search)
const sourceQuery = ref(sourceSelections.find((source) => source.value === props.source))
const featuredQuery = ref(featuredSelections.find((a) => a.value === props.featured))

const currentSortBy = ref(props.sortBy)
const currentSortOrder = ref(props.sortOrder as 'asc' | 'desc')

const page = ref(props.page)
const products = computed(() => {
  return props.products.data.map((product) => {
    product.checked = false
    return product
  })
})

const updating = ref(false)

const showDetails = ref(false)
const selectedProduct = ref<any | null>(null)

const updateProducts = (products: any[], featured: boolean) => {
  updating.value = true
  axios.post('/admin/products', { products, featured }).then(() => {
    reload()
  })
}

const reload = () => {
  loading.value = true

  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const paramsStore: { [key: string]: string | null | undefined } = {}

  for (let searchParam of searchParams) {
    paramsStore[searchParam[0]] = searchParam[1]
  }

  if (searchQuery.value === '') {
    delete paramsStore['search']
  } else {
    const previousSearch = searchParams.get('search')
    if (previousSearch !== searchQuery.value) {
      page.value = 1
    }

    // strip out url params
    paramsStore['search'] = searchQuery.value.replace(/#.*$/, '').replace(/\?.*$/, '')
  }

  const selections = {
    source: sourceQuery.value,
    featured: featuredQuery.value,
  }

  for (let [name, selection] of Object.entries(selections)) {
    const selected = toRaw(selection) as { name: string; value: any } | null
    if (selected) {
      if (selected.value === null || selected.value === undefined) {
        delete paramsStore[name]
      } else {
        paramsStore[name] = selected.value
      }
    } else {
      delete paramsStore[name]
    }
  }

  paramsStore['page'] = page.value.toString()
  paramsStore['limit'] = props.limit.toString()

  if (currentSortBy.value) {
    paramsStore['sortBy'] = currentSortBy.value
    paramsStore['sortOrder'] = currentSortOrder.value
  } else {
    delete paramsStore['sortBy']
    delete paramsStore['sortOrder']
  }

  router.visit(
    `${url.pathname}?` +
      Object.entries(paramsStore)
        .map(([key, value]) => `${key}=${value}`)
        .join('&'),
    {
      preserveScroll: true,
      onFinish: () => (loading.value = false),
      onError: () => (loading.value = false),
    }
  )
}

watch([sourceQuery, featuredQuery, page], () => {
  reload()
})

const handleSort = (header: any) => {
  if (currentSortBy.value === header.value) {
    currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortBy.value = header.value
    currentSortOrder.value = 'asc'
  }
  page.value = 1
  reload()
}

const resetFilters = () => {
  featuredQuery.value = undefined
  searchQuery.value = ''
  if (page.value !== 1) {
    page.value = 1
  }
}

const openDetails = (product: any) => {
  selectedProduct.value = product
  showDetails.value = true
}

const closeDetails = () => {
  showDetails.value = false
  selectedProduct.value = null
}

const setSelectedFeatured = (featured: boolean) => {
  if (!selectedProduct.value) return
  updateProducts([selectedProduct.value], featured)
  showDetails.value = false
}

const getColspan = (headers: any[], selectable: boolean, showActions: boolean) => {
  let colspan = headers.length
  if (selectable) colspan++
  if (showActions) colspan++
  return colspan
}
</script>

<template>
  <Head title="All Products" />
  <AdminLayout>
    <div class="p-3">
      <div class="sm:flex sm:items-center mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Products</h1>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 mt-2">
        <!-- Search -->
        <TextInput
          class="lg:col-span-2"
          id="seller-search"
          v-model="searchQuery"
          v-on:keyup.enter="nextTick(() => reload())"
          :disabled="loading"
          :placeholder="sourceQuery?.value === 'db' ? 'Search by product name or ID' : 'Search by product name, URL or Item ID'"
        />

        <Select
          v-if="sourceQuery?.value === 'db'"
          class="lg:col-span-1"
          v-model="featuredQuery"
          :items="featuredSelections"
          track-by="value"
          option-label="name"
          placeholder="Featured Status"
          @update:model-value="page = 1"
        />

        <div
          class="flex justify-end lg:col-span-1"
          :class="{ 'lg:col-end-7': sourceQuery?.value === 'api' }"
        >
          <Button
            @click="resetFilters"
            :disabled="loading"
            :color="'primary'"
            class="w-full md:w-fit"
          >
            Reset
          </Button>
        </div>
      </div>

      <Table
        :headers="enhancedHeaders"
        :selectable="false"
        :show-actions="true"
        :current-sort="{ by: currentSortBy, order: currentSortOrder }"
        @sort="handleSort"
      >
        <template #body="{ headers, selectable, showActions }">
          <TableEmpty
            v-if="products.length === 0"
            :colspan="getColspan(headers, selectable, showActions)"
            title="No products found"
            description="Try adjusting your search or filters"
          />
          <TableLoading v-else-if="loading" :headers="headers" :selectable="selectable" :rows="5" />
          <TableRow
            v-else
            v-for="product in products"
            :key="product.id || product.platformItemId"
            :headers="headers"
            :data="product"
            :selectable="selectable"
            :selected="product.checked"
            :show-actions="true"
          >
            <template #cell-cashback="{ data }">
              {{ data.currency + data.cashback.toFixed(2) }}
            </template>
            <template #cell-name="{ data }">
              <div class="flex items-center gap-x-4">
                <img
                  :src="data.imageUrl ?? '/images/shopee_icon.jpg'"
                  alt=""
                  class="size-8 rounded bg-gray-800 dark:bg-gray-700 flex-shrink-0"
                />
                <a
                  :href="data.productLink"
                  target="_blank"
                  class="block max-w-[22rem] truncate text-sm/6 font-medium text-marine-600 dark:text-marine-300 hover:underline"
                >
                  {{ data.name }}
                </a>
              </div>
            </template>
            <template #cell-featured="{ data }">
              <div class="flex items-center justify-center gap-x-2">
                <ToggleWithIcon
                  :disabled="updating"
                  :model-value="data.featured || false"
                  @update:model-value="updateProducts([data], $event)"
                />
              </div>
            </template>

            <template #actions="{ data }">
              <Button @click="openDetails(data)" color="primary">Details</Button>
            </template>
          </TableRow>
        </template>
      </Table>

      <Pagination
        v-if="sourceQuery?.value === 'db'"
        :paginations="props.products.meta as PaginationInterface"
        class="my-5"
        @change-page="(i) => (page = i)"
      />
      <SimplePagination
        v-else
        :paginations="props.products.meta as SimplePaginationInterface"
        class="my-5"
        @change-page="(i) => (page = i)"
      />
    </div>
    <Modal :show="showDetails" @close="closeDetails" max-width="4xl">
      <template #title> Product Details</template>
      <div class="flex gap-4">
        <img
          :src="selectedProduct?.imageUrl ?? '/images/shopee_icon.jpg'"
          class="w-24 h-24 rounded bg-gray-800 dark:bg-gray-700"
        />
        <div class="flex-1 min-w-0">
          <div class="text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ selectedProduct?.name }}
          </div>
          <div class="mt-1 text-sm text-gray-600 dark:text-gray-300 break-words">
            <a
              :href="selectedProduct?.productLink"
              target="_blank"
              class="text-marine-600 dark:text-marine-300 hover:underline"
              >Open on Shopee</a
            >
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Price:</span>
              {{ selectedProduct?.currency + selectedProduct?.priceMin.toFixed(2) }} -
              {{ selectedProduct?.currency + selectedProduct?.priceMax.toFixed(2) }}
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Commission (Shopee + Seller):</span>
              {{ floorDecimalPoints(selectedProduct?.shopeeCommissionRate * 100) }}% +
              {{ floorDecimalPoints(selectedProduct?.sellerCommissionRate * 100) }}%
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Rating:</span>
              {{ selectedProduct?.rating }}
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Seller:</span>
              {{ selectedProduct?.sellerName || '-' }}
            </div>
          </div>
        </div>
      </div>
      <div class="mt-10 sm:mt-6 flex items-center justify-end">
        <div class="flex gap-2">
          <Button
            v-if="selectedProduct?.featured"
            @click="setSelectedFeatured(false)"
            color="danger"
          >
            Defeature
          </Button>
          <Button v-else @click="setSelectedFeatured(true)" color="primary">Feature</Button>
        </div>
      </div>
    </Modal>
  </AdminLayout>
</template>
