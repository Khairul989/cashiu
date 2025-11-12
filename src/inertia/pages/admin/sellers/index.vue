<script setup lang="ts">
import AdminLayout from '~/layouts/AdminLayout.vue'
import TextInput from '~/components/TextInput.vue'
import { Head, router } from '@inertiajs/vue3'
import { computed, ComputedRef, ref, toRaw, watch, nextTick } from 'vue'
import { default as Table } from '~/components/Table.vue'
import { default as TableRow } from '~/components/TableRow.vue'
import { default as TableEmpty } from '~/components/TableEmpty.vue'
import { default as TableLoading } from '~/components/TableLoading.vue'
import Pagination, { PaginationInterface } from '~/components/Pagination.vue'
import ToggleWithIcon from '~/components/ToggleWithIcon.vue'
import axios from 'axios'
import PrimaryButton from '~/components/PrimaryButton.vue'
import DangerButton from '~/components/DangerButton.vue'
import SimplePagination, { SimplePaginationInterface } from '~/components/SimplePagination.vue'
import { AdminSeller } from '#types/seller'
import InfoIconWithTooltip from '~/components/InfoIconWithTooltip.vue'
import Select from '~/components/Select.vue'
import Button from '~/components/Button.vue'

const props = defineProps({
  sellers: {
    type: Object as () => {
      data: Array<AdminSeller>
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
  category: { type: Number, required: false, default: null },
  product: { type: String, required: false, default: null },
  featured: { type: String, required: false, default: null },
  source: { type: String, required: false, default: 'db' },
  page: { type: Number, required: false, default: 1 },
  limit: { type: Number, required: false, default: 25 },
  sortBy: { type: String, required: false, default: null },
  sortOrder: { type: String, required: false, default: 'asc' },
  sellerActiveStatus: { type: String, required: false, default: null },
  productActiveStatus: { type: String, required: false, default: null },
})

const loading = ref(false)

// Enhanced headers configuration for the new table system
const enhancedHeaders = computed(() => {
  return props.headers.map((header) => {
    const baseHeader = {
      name: header.name,
      value: header.value,
      sortable: header.sortable,
      align: 'left' as const,
    }

    // Customize headers based on their purpose
    switch (header.value) {
      case 'id':
        return { ...baseHeader, width: 'w-32' }
      case 'name':
        return { ...baseHeader, align: 'left' as const }
      case 'category':
        return { ...baseHeader, align: 'center' as const, type: 'custom' as const }
      case 'commissionRate':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'productsCount':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'activeProductCount':
        return { ...baseHeader, align: 'center' as const, type: 'number' as const }
      case 'lastSyncedAt':
        return { ...baseHeader, align: 'center' as const, type: 'date' as const }
      case 'isActive':
        return { ...baseHeader, align: 'center' as const, type: 'boolean' as const }
      case 'isFeatured':
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
const categorySelections = [
  { name: 'Shopee Mall', value: 1 },
  { name: 'Shopee Preferred', value: 2 },
  { name: 'Shopee Preferred+', value: 3 },
]
const productFetchStatusSelections = [
  { name: 'Synced', value: 'true' },
  { name: 'In progress', value: 'false' },
]
const sellerFeaturedStatusSelections = [
  { name: 'Featured', value: 'true' },
  { name: 'Not Featured', value: 'false' },
]
const sellerActiveStatusSelections = [
  { name: 'Active', value: 'true' },
  { name: 'Inactive', value: 'false' },
]
const proudctActiveStatusSelections = [
  { name: 'Has Active Products', value: 'true' },
  { name: 'No Active Products', value: 'false' },
]

const checkAll = ref(false)
const searchQuery = ref(props.search)
const sourceQuery = ref(sourceSelections.find((source) => source.value === props.source))
const categoryQuery = ref(
  categorySelections.find((category) => category.value === Number(props.category))
)
const productFetchStatusQuery = ref(
  productFetchStatusSelections.find((status) => status.value === props.product)
)
const sellerFeaturedStatusQuery = ref(
  sellerFeaturedStatusSelections.find((status) => status.value === props.featured)
)

const sellerActiveStatusQuery = ref(
  sellerActiveStatusSelections.find((status) => status.value === props.sellerActiveStatus)
)

const proudctActiveStatusQuery = ref(
  proudctActiveStatusSelections.find((status) => status.value === props.productActiveStatus)
)

const resetFilters = () => {
  searchQuery.value = ''
  categoryQuery.value = undefined
  productFetchStatusQuery.value = undefined
  sellerFeaturedStatusQuery.value = undefined
  sellerActiveStatusQuery.value = undefined
  proudctActiveStatusQuery.value = undefined

  if (page.value !== 1) {
    page.value = 1
  }
}

const currentSortBy = ref(props.sortBy)
const currentSortOrder = ref(props.sortOrder as 'asc' | 'desc')

const page = ref(props.page)
const sellers: ComputedRef<AdminSeller[]> = computed(() => {
  return props.sellers.data.map((seller) => {
    seller.checked = false
    return seller
  })
})

const toPublish = ref<AdminSeller[]>([])
const toUnpublish = ref<AdminSeller[]>([])
const showPublishSelected = ref(false)
const showUnpublishSelected = ref(false)
const updatingPublish = ref(false)

const updateSellers = (sellers: AdminSeller[], isActive: boolean, isFeatured: boolean = false) => {
  updatingPublish.value = true

  axios.post('/admin/sellers', { sellers, isActive, isFeatured }).then(() => {
    reload()
  })
}

const reload = () => {
  loading.value = true
  // make publish and featured status default to all if source is from Shopee API
  if (sourceQuery.value?.value === 'api') {
    productFetchStatusQuery.value = productFetchStatusSelections[0]
    sellerFeaturedStatusQuery.value = sellerFeaturedStatusSelections[0]
  }

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

    paramsStore['search'] = searchQuery.value
  }

  const selections = {
    category: categoryQuery.value,
    product: productFetchStatusQuery.value,
    featured: sellerFeaturedStatusQuery.value,
    source: sourceQuery.value,
    sellerActiveStatus: sellerActiveStatusQuery.value,
    productActiveStatus: proudctActiveStatusQuery.value,
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
      onFinish: () => {
        loading.value = false
      },
      onError: () => {
        loading.value = false
      },
    }
  )
}

const watchCheckBox = (sellerList: AdminSeller[]) => {
  sellerList.forEach((seller) => {
    if (seller.checked) {
      if (seller.isActive) {
        toUnpublish.value.push(seller)
      } else {
        toPublish.value.push(seller)
      }
    } else {
      toPublish.value = toPublish.value.filter(
        (person) => person.platformSellerId !== seller.platformSellerId
      )
      toUnpublish.value = toUnpublish.value.filter(
        (person) => person.platformSellerId !== seller.platformSellerId
      )
    }
  })

  checkAll.value = sellers.value.every((seller) => seller.checked)

  showPublishSelected.value = toPublish.value.length > 0
  showUnpublishSelected.value = toUnpublish.value.length > 0
}

watch(checkAll, () => {
  if (
    sellers.value.every((seller) => seller.checked) ||
    sellers.value.every((seller) => !seller.checked)
  ) {
    sellers.value.map((seller) => (seller.checked = checkAll.value))
  }

  watchCheckBox(sellers.value)
})

watch(
  [
    categoryQuery,
    productFetchStatusQuery,
    sellerFeaturedStatusQuery,
    sourceQuery,
    sellerActiveStatusQuery,
    proudctActiveStatusQuery,
    page,
  ],
  (newValues, oldValues) => {
    let filterHasChanged = false
    // Check if any of the filter selection objects (indices 0-5) have changed.
    for (let i = 0; i < 6; i++) {
      if (newValues[i] !== oldValues[i]) {
        filterHasChanged = true
        break
      }
    }

    if (filterHasChanged) {
      page.value = 1
    }

    reload()
  }
)

const handleSort = (header: any) => {
  if (currentSortBy.value === header.value) {
    currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortBy.value = header.value
    currentSortOrder.value = 'asc'
  }
  page.value = 1 // Reset to first page when sorting changes
  reload()
}

// Helper function to calculate colspan for empty state
const getColspan = (headers: any[], selectable: boolean, showActions: boolean) => {
  let colspan = headers.length
  if (selectable) colspan++
  if (showActions) colspan++
  return colspan
}

// Handle select all change
const handleSelectAllChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const checked = target.checked

  sellers.value.forEach((seller) => {
    seller.checked = checked
  })

  checkAll.value = checked
  watchCheckBox(sellers.value)
}

// Handle individual seller selection
const handleSellerSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const sellerId = target.closest('tr')?.getAttribute('data-seller-id')
  const seller = sellers.value.find((s) => s.id.toString() === sellerId)

  if (seller) {
    seller.checked = target.checked
    watchCheckBox([seller])
  }
}
</script>

<template>
  <Head title="All Sellers" />
  <AdminLayout>
    <div class="p-3">
      <div class="sm:flex sm:items-center mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Sellers</h1>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-2">
        <!-- Search -->
        <TextInput
          class="lg:col-span-2"
          id="seller-search"
          v-model="searchQuery"
          v-on:keyup.enter="nextTick(() => reload())"
          :disabled="loading"
          placeholder="Search by seller name or ID"
        />

        <Select
          class="lg:col-span-1"
          v-model="categoryQuery"
          :items="categorySelections"
          track-by="value"
          option-label="name"
          placeholder="Category"
        />

        <div v-if="sourceQuery?.value === 'db'" class="grid grid-cols-2 gap-4 lg:col-span-2">
          <Select
            class="lg:col-span-1"
            v-model="productFetchStatusQuery"
            :items="productFetchStatusSelections"
            track-by="value"
            option-label="name"
            placeholder="Product Sync"
          />

          <Select
            class="lg:col-span-1"
            v-model="sellerFeaturedStatusQuery"
            :items="sellerFeaturedStatusSelections"
            track-by="value"
            option-label="name"
            placeholder="Featured Status"
          />
        </div>

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

      <div
        class="flex justify-start gap-x-4"
        :class="{ 'lg:mt-6': showPublishSelected || showUnpublishSelected }"
      >
        <PrimaryButton
          v-if="showPublishSelected"
          @click="updateSellers(toPublish, true)"
          :disabled="updatingPublish"
        >
          Publish Selected
        </PrimaryButton>
        <DangerButton
          v-if="showUnpublishSelected"
          @click="updateSellers(toUnpublish, false)"
          :disabled="updatingPublish"
        >
          Unpublish Selected
        </DangerButton>
      </div>
      <Table
        :headers="enhancedHeaders"
        :selectable="false"
        :can-select-all="true"
        :select-all="checkAll"
        :current-sort="{ by: currentSortBy, order: currentSortOrder }"
        @select-all-change="handleSelectAllChange"
        @sort="handleSort"
      >
        <template #body="{ headers, selectable }">
          <!-- Empty state -->
          <TableEmpty
            v-if="sellers.length === 0"
            :colspan="getColspan(headers, selectable, false)"
            title="No sellers found"
            description="Try adjusting your search criteria or filters"
          />

          <!-- Loading state -->
          <TableLoading v-else-if="loading" :headers="headers" :selectable="selectable" :rows="5" />

          <!-- Data rows -->
          <TableRow
            v-else
            v-for="seller in sellers"
            :key="seller.id"
            :headers="headers"
            :data="seller"
            :selectable="selectable"
            :selected="seller.checked"
            @select-change="handleSellerSelect"
            :data-seller-id="seller.id"
          >
            <!-- Custom cell for seller column -->
            <template #cell-name="{ data }">
              <div class="flex items-center gap-x-4">
                <img
                  :src="data.imageUrl ?? '/images/shopee_icon.jpg'"
                  alt=""
                  class="size-8 rounded-full bg-gray-800 dark:bg-gray-700"
                />
                <a
                  :href="data.platformSellerUrl"
                  target="_blank"
                  class="truncate text-sm/6 font-medium text-marine-600 dark:text-marine-300 hover:underline"
                >
                  {{ data.name }}
                </a>
              </div>
            </template>

            <!-- Custom cell for category column -->
            <template #cell-category="{ data }">
              {{ data.category.join(', ') }}
            </template>

            <!-- Custom cell for last synced column -->
            <template #cell-lastSyncedAt="{ data }">
              {{ data.lastSyncedAt || '-' }}
            </template>

            <!-- Custom cell for featured seller toggle -->
            <template #cell-isFeatured="{ data }">
              <div class="flex items-center justify-center gap-x-2">
                <ToggleWithIcon
                  :disabled="updatingPublish"
                  :model-value="(data as AdminSeller).isFeatured || false"
                  @update:model-value="updateSellers([data as AdminSeller], true, $event)"
                />
              </div>
            </template>
          </TableRow>
        </template>

        <!-- Custom header content for tooltips -->
        <template #header-productsCount>
          <div class="flex items-center gap-2">
            <InfoIconWithTooltip
              tooltipText="Total commisionable products. Will not be shown in featured section if there are no commisionable products."
            />
          </div>
        </template>

        <template #header-activeProductCount>
          <div class="flex items-center gap-2">
            <InfoIconWithTooltip
              tooltipText="The number of products from this seller that currently have an active seller commission. Only these products are eligible for cashback and will be displayed in the app. (Updated via product sync on Shopee API data.)"
            />
          </div>
        </template>

        <template #header-isActive>
          <div class="flex items-center gap-2">
            <InfoIconWithTooltip
              tooltipText="Indicates if this seller is active and their products are synced. 'On' means product data is regularly updated. 'Off' means no new product syncs, and all of its active products will no longer be shown in the app. Toggle this off to hide products from this seller in the app."
            />
          </div>
        </template>

        <template #header-isFeatured>
          <div class="flex items-center gap-2">
            <InfoIconWithTooltip
              tooltipText="Controls if this seller appears in the main 'Featured Sellers' list and search. If 'Off', the seller is hidden from this list but their products remain visible and searchable in the app. If 'On', the seller is included in the 'Featured Sellers' list."
            />
          </div>
        </template>
      </Table>
      <Pagination
        v-if="sourceQuery?.value === 'db'"
        :paginations="props.sellers.meta as PaginationInterface"
        class="my-5"
        @change-page="(i) => (page = i)"
      />
      <SimplePagination
        v-else
        :paginations="props.sellers.meta as SimplePaginationInterface"
        class="my-5"
        @change-page="(i) => (page = i)"
      />
    </div>
  </AdminLayout>
</template>
