<script setup lang="ts">
import AdminLayout from '~/layouts/AdminLayout.vue'
import { ref, computed, watch } from 'vue'
import { router, Head } from '@inertiajs/vue3'
import { useForm } from '@inertiajs/vue3'
import { CheckIcon } from '@heroicons/vue/24/outline'
import Pagination, { PaginationInterface } from '~/components/Pagination.vue'
import TextInput from '~/components/TextInput.vue'
import { useDebouncedRef } from '~/js/debounceRef'
import Button from '~/components/Button.vue'
import { toast, ToastOptions } from 'vue3-toastify'
import Stat from '~/components/Stat.vue'
import ActionReason from '#models/action_reason'
import Modal from '~/components/Modal.vue'
import Select from '~/components/Select.vue'
import Table from '~/components/Table.vue'
import TableEmpty from '~/components/TableEmpty.vue'
import TableRow from '~/components/TableRow.vue'

// Define interfaces for type safety
interface ConversionHeader {
  name: string
  value: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom'
}

interface ConversionStatus {
  id: number
  value: string
}

interface Conversion {
  id: number
  conversionId: number
  seller: string
  user: string
  datetimeConversion: string
  myrSaleAmount: number
  cashbackPayout: number
  status: string
  checked: boolean
  reason: string | null
  // Additional fields for modal
  sellerId: number
  productId: number | null
  userId: number
  offerId: number
  orderId: string | null
  clickId: string | null
  category: string | null
  myrPayout: number
  sellerCommissionRate: number
  advSubs: Record<string, string | null>
  affSubs: Record<string, string | null>
  withdrawalId: number | null
  remarks: string | null
  createdAt: string
  updatedAt: string
}

interface ConversionsData {
  data: Conversion[]
  meta: PaginationInterface
}

const props = defineProps({
  headers: { type: Array as () => ConversionHeader[], required: true },
  conversions: { type: Object as () => ConversionsData, required: true },
  conversionStatuses: { type: Array as () => ConversionStatus[], required: true },
  actionReasons: { type: Array as () => ActionReason[], required: true },
  conversionId: { type: String, required: false, default: undefined },
  orderId: { type: String, required: false, default: undefined },
  status: { type: Number, required: false, default: undefined },
  stats: { type: Array as () => { name: string; stat: string }[], required: true },
  sortBy: { type: String, required: false, default: 'datetimeConversion' },
  sortOrder: { type: String, required: false, default: 'desc' },
  page: { type: Number, required: false, default: 1 },
  limit: { type: Number, required: false, default: 25 },
})

// Set defaults for optional props
const conversionIdQuery = useDebouncedRef(props.conversionId, 500)
const orderIdQuery = useDebouncedRef(props.orderId, 500)
const selectedStatus = ref(
  props.conversionStatuses.find((status) => status.id === parseInt(props.status?.toString() ?? '0'))
)
const selectedConversionStatus = ref<ConversionStatus | null>(null)
const selectedActionReason = ref<ActionReason | null>(null)
const page = ref(props.page)
const selectAll = ref(false)
const processing = ref(false)
const loading = ref(false)

// Sorting state
const currentSortBy = ref(props.sortBy)
const currentSortOrder = ref(props.sortOrder)

// Confirmation dialog states
const showConfirmation = ref(false)
const selectedCount = computed(() => form.conversions.length)

// View details modal states
const showViewDetailsModal = ref(false)
const selectedConversion = ref<Conversion | null>(null)

// Create a form for bulk actions
const form = useForm<{
  conversions: number[]
  statusId: number | null
  actionReasonId: number | null
}>({
  conversions: [],
  statusId: null,
  actionReasonId: null,
})

// Enhanced headers with proper types for the Table component
const enhancedHeaders = computed(() => {
  return props.headers.map((header) => ({
    ...header,
    sortable: header.sortable ?? false,
    type: getHeaderType(header.value),
    align: getHeaderAlignment(header.value),
  }))
})

// Helper function to determine header type
const getHeaderType = (
  value: string
): 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom' => {
  switch (value) {
    case 'myrSaleAmount':
    case 'cashbackPayout':
      return 'currency'
    case 'datetimeConversion':
      return 'date'
    case 'conversionId':
      return 'number'
    case 'status':
      return 'custom'
    case 'actions':
      return 'custom'
    default:
      return 'text'
  }
}

// Helper function to determine header alignment
const getHeaderAlignment = (value: string): 'left' | 'center' | 'right' => {
  switch (value) {
    case 'myrSaleAmount':
    case 'cashbackPayout':
      return 'right'
    case 'status':
      return 'center'
    case 'actions':
      return 'center'
    default:
      return 'left'
  }
}

// Centralized reload function
const reload = () => {
  loading.value = true

  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const paramsStore: { [key: string]: string | null | undefined } = {}

  for (let searchParam of searchParams) {
    paramsStore[searchParam[0]] = searchParam[1]
  }

  if (!conversionIdQuery.value) {
    delete paramsStore['conversion_id']
  } else {
    const previousConversionId = searchParams.get('conversion_id')
    const trimmedConversionId = conversionIdQuery.value.trim()

    if (previousConversionId !== trimmedConversionId) {
      page.value = 1
    }

    paramsStore['conversion_id'] = trimmedConversionId
  }

  if (orderIdQuery.value) {
    paramsStore['order_id'] = orderIdQuery.value
  } else {
    delete paramsStore['order_id']
  }

  if (selectedStatus.value) {
    paramsStore['status'] = selectedStatus.value.id.toString()
  } else {
    delete paramsStore['status']
  }

  paramsStore['page'] = page.value.toString()
  paramsStore['limit'] = props.limit.toString()
  paramsStore['sort_by'] = currentSortBy.value
  paramsStore['sort_order'] = currentSortOrder.value

  router.visit(
    `${url.pathname}?` +
      Object.entries(paramsStore)
        .map(([key, value]) => `${key}=${value}`)
        .join('&'),
    {
      onFinish: () => {
        loading.value = false
      },
      onError: () => {
        loading.value = false
      },
      preserveState: true,
    }
  )
}

// Check if conversions can be selected (only if user has update permission)
const canSelectConversions = computed(() => {
  return false
})

// Reset all filters
const resetFilters = () => {
  conversionIdQuery.value = ''
  orderIdQuery.value = ''
  selectedStatus.value = undefined
}

// Watch for changes with unified reload function
watch(
  [conversionIdQuery, orderIdQuery, selectedStatus, page, currentSortBy, currentSortOrder],
  (newValues, oldValues) => {
    let filterHasChanged = false
    // Check if conversion_id or status filter has changed (indices 0-1)
    for (let i = 0; i < 2; i++) {
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

// Navigate to a specific page
const handlePageChange = (pageNumber: number) => {
  page.value = pageNumber
}

// Toggle select all conversions
const toggleSelectAll = () => {
  if (!canSelectConversions.value) return

  selectAll.value = !selectAll.value
  if (props.conversions && props.conversions.data) {
    props.conversions.data.forEach((conversion: Conversion) => {
      conversion.checked = selectAll.value === true
    })
    updateSelectedConversions()
  }
}

// Update the form with selected conversions
const updateSelectedConversions = () => {
  if (props.conversions && props.conversions.data) {
    form.conversions = props.conversions.data
      .filter((conversion: Conversion) => conversion.checked === true)
      .map((conversion: Conversion) => conversion.id)
  }
}

// Handle conversion selection
const toggleConversion = (conversion: Conversion) => {
  if (!canSelectConversions.value) return

  conversion.checked = conversion.checked === true ? false : true
  updateSelectedConversions()
}

// Computed property to check if any conversions are selected
const hasSelectedConversions = computed(() => {
  return form.conversions.length > 0
})

// Show confirmation dialog for updating conversions
const confirmUpdate = () => {
  if (!hasSelectedConversions.value) return
  selectedActionReason.value = null // Reset action reason when opening dialog
  showConfirmation.value = true
}

// Reset confirmation dialog
const closeConfirmation = () => {
  showConfirmation.value = false
  selectedActionReason.value = null
}

// Open view details modal
const openViewDetailsModal = (conversion: Conversion) => {
  selectedConversion.value = conversion
  showViewDetailsModal.value = true
}

// Close view details modal
const closeViewDetailsModal = () => {
  showViewDetailsModal.value = false
  selectedConversion.value = null
}

// Update selected conversions
const updateConversions = async () => {
  showConfirmation.value = false
  processing.value = true

  if (!selectedConversionStatus) {
    toast('Please select a status', {
      position: toast.POSITION.TOP_RIGHT,
      theme: 'colored',
      type: 'error',
      autoClose: 5000,
    } as ToastOptions)

    processing.value = false
    showConfirmation.value = true

    return
  }

  if (selectedConversionStatus.value?.value.toLowerCase() === 'rejected') {
    if (!selectedActionReason.value) {
      toast('Please select a reason for rejection', {
        position: toast.POSITION.TOP_RIGHT,
        theme: 'colored',
        type: 'error',
        autoClose: 5000,
      } as ToastOptions)

      processing.value = false
      showConfirmation.value = true

      return
    }
  } else {
    selectedActionReason.value = null
  }

  form.statusId = selectedConversionStatus.value?.id || null
  form.actionReasonId = selectedActionReason.value?.id || null

  router.post('/admin/conversions', form.data(), {
    onFinish: () => {
      selectAll.value = false
      form.reset()
      selectedActionReason.value = null
      processing.value = false
      reload()
    },
    onError: () => {
      processing.value = false
    },
  })
}

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Handle column sorting
const handleSort = (header: ConversionHeader) => {
  if (!header.sortable) return

  const columnMap: { [key: string]: string } = props.headers
    .filter((header) => header.sortable)
    .reduce(
      (acc, header) => {
        acc[header.value] = header.value
        return acc
      },
      {} as { [key: string]: string }
    )

  const sortColumn = columnMap[header.value]

  if (!sortColumn) return // Skip if no mapping found

  if (currentSortBy.value === sortColumn) {
    // Toggle sort order if same column
    currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new column with default ascending order
    currentSortBy.value = sortColumn
    currentSortOrder.value = 'asc'
  }
}

// Get colspan for empty state
const getColspan = computed(() => {
  let colspan = enhancedHeaders.value.length
  if (canSelectConversions.value) colspan++
  return colspan
})

// Current sort state for Table component
const currentSort = computed(() => ({
  by: currentSortBy.value,
  order: currentSortOrder.value as 'asc' | 'desc',
}))
</script>

<template>
  <AdminLayout>
    <Head title="Conversions Management" />
    <div class="p-3">
      <div class="sm:flex sm:items-center mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
            Conversions
          </h1>
        </div>
        <div class="flex justify-between"></div>
      </div>
      <div class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mt-2">
        <TextInput
          class="lg:col-span-2"
          type="text"
          v-model="conversionIdQuery"
          :disabled="loading"
          placeholder="Search by Conversion ID (separated by comma)"
        />

        <TextInput
          class="lg:col-span-2"
          type="text"
          v-model="orderIdQuery"
          :disabled="loading"
          placeholder="Search by Order ID"
        />

        <Select
          class="lg:col-span-1"
          v-model="selectedStatus"
          :items="conversionStatuses"
          :option-label="
            (item: any) =>
              `${item.value.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())}`
          "
          placeholder="Status"
        />

        <div class="lg:col-span-2 flex justify-between lg:justify-end lg:gap-2">
          <Button @click="resetFilters" :disabled="loading" :color="'primary'">Reset</Button>
        </div>
      </div>

      <div class="my-5">
        <Stat :stats="stats" class="mx-auto" />
      </div>

      <!-- Filters and Actions -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        v-show="selectedCount > 0 || canSelectConversions"
      >
        <!-- Bulk Actions -->
        <div class="flex gap-2">
          <Button
            :disabled="!hasSelectedConversions || processing || loading || !canSelectConversions"
            :color="'primary'"
            @click="confirmUpdate"
          >
            <CheckIcon class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Update Conversion
          </Button>
        </div>
      </div>

      <!-- Table using Table component -->
      <Table
        :headers="enhancedHeaders"
        :selectable="canSelectConversions"
        :can-select-all="canSelectConversions"
        :select-all="selectAll"
        :current-sort="currentSort"
        @select-all-change="toggleSelectAll"
        @sort="handleSort"
      >
        <template #body="{ selectable }">
          <!-- Empty state -->
          <TableEmpty
            v-if="!conversions?.data?.length"
            :colspan="getColspan"
            title="No conversions found"
            description="Try adjusting your search criteria or filters"
          />

          <!-- Table rows with custom cell content -->
          <TableRow
            v-else
            v-for="conversion in conversions?.data || []"
            :key="conversion.id"
            :headers="enhancedHeaders"
            :data="conversion"
            :selectable="selectable"
            :selected="Boolean(conversion.checked)"
            :selectDisabled="!canSelectConversions"
            @select-change="toggleConversion(conversion)"
          >
            <template #cell-conversionId="{ data }">
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {{ data.conversionId }}
              </span>
            </template>

            <template #cell-statusId="{ data }">
              <span
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium relative group"
                :class="getStatusColor(data.status)"
              >
                {{ data.status }}
                <span
                  v-if="data.reason"
                  class="absolute left-1/2 -translate-x-1/2 top-full mt-2 max-w-xs w-64 z-50 rounded bg-gray-700 p-2 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal break-words"
                >
                  {{ data.reason }}
                </span>
              </span>
            </template>

            <template #cell-actions="">
              <Button
                @click="openViewDetailsModal(conversion)"
                :color="'primary'"
                class="text-xs px-2 py-1"
              >
                View Details
              </Button>
            </template>
          </TableRow>
        </template>
      </Table>

      <!-- Pagination -->
      <Pagination
        v-if="props.conversions?.meta"
        :paginations="props.conversions.meta"
        class="my-5"
        @change-page="handlePageChange"
      />
    </div>

    <!-- Confirmation Dialog using shared Modal component -->
    <Modal :show="showConfirmation" @close="closeConfirmation" max-width="2xl">
      <template #title> Update Conversion Status </template>

      <div class="sm:flex sm:items-start">
        <div class="w-1/6 flex justify-center">
          <div
            class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-primary-100"
          >
            <CheckIcon class="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
        </div>
        <div class="w-full">
          <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-300">
                Update status for {{ selectedCount }} conversion{{
                  selectedCount !== 1 ? 's' : ''
                }}.
              </p>
            </div>

            <div class="w-full mt-4">
              <!-- Conversion Status Dropdown -->
              <div class="w-full">
                <label
                  for="conversion-status"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Conversion Status<span class="text-red-500">*</span>
                </label>

                <Select
                  v-model="selectedConversionStatus"
                  :items="conversionStatuses"
                  :disabled="loading"
                  :option-label="
                    (s: any) =>
                      s.value.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())
                  "
                  placeholder="Select Status"
                />
              </div>

              <!-- Action Reason Dropdown for Rejection -->
              <div
                v-if="selectedConversionStatus?.value.toLowerCase() === 'rejected'"
                class="mt-4 w-full"
              >
                <label
                  for="action-reason"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Reason for Rejection<span class="text-red-500">*</span>
                </label>

                <Select
                  v-model="selectedActionReason"
                  :items="actionReasons"
                  :disabled="loading"
                  option-label="reason"
                  placeholder="Select Reason"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5 sm:mt-4 sm:flex gap-2 sm:flex-row-reverse">
        <Button
          :disabled="
            selectedConversionStatus?.value.toLowerCase() === 'rejected' && !selectedActionReason
          "
          @click="updateConversions"
          :color="'primary'"
        >
          Update
        </Button>
        <Button
          :color="'secondary'"
          class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          @click="closeConfirmation"
        >
          Cancel
        </Button>
      </div>
    </Modal>

    <!-- View Details Modal -->
    <Modal :show="showViewDetailsModal" @close="closeViewDetailsModal" max-width="4xl">
      <template #title>Conversion Details</template>

      <!-- Fixed height container with scrollable content -->
      <div class="min-h-auto max-h-[80vh] overflow-y-auto pr-2">
        <div v-if="selectedConversion" class="space-y-6">
          <!-- Basic Information Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Conversion ID</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.conversionId }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Status</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium relative group"
                    :class="getStatusColor(selectedConversion.status)"
                  >
                    {{ selectedConversion.status }}
                    <span
                      v-if="selectedConversion.reason"
                      class="absolute left-1/2 -translate-x-1/2 top-full mt-2 max-w-xs w-64 z-50 rounded bg-gray-700 p-2 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal break-words"
                    >
                      {{ selectedConversion.reason }}
                    </span>
                  </span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Date</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.datetimeConversion }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Category</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.category || 'N/A' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Financial Information Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Financial Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Sale Amount (MYR)</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {{
                    new Intl.NumberFormat('en-MY', {
                      style: 'currency',
                      currency: 'MYR',
                      minimumFractionDigits: 2,
                    }).format(selectedConversion.myrSaleAmount)
                  }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Cashback Payout (MYR)</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {{
                    new Intl.NumberFormat('en-MY', {
                      style: 'currency',
                      currency: 'MYR',
                      minimumFractionDigits: 2,
                    }).format(selectedConversion.cashbackPayout)
                  }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payout (MYR)
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {{
                    new Intl.NumberFormat('en-MY', {
                      style: 'currency',
                      currency: 'MYR',
                      minimumFractionDigits: 2,
                    }).format(selectedConversion.myrPayout)
                  }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seller Commission Rate
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {{ selectedConversion.sellerCommissionRate }}%
                </p>
              </div>
            </div>
          </div>

          <!-- Entity Information Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Entity Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seller
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.seller }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.user }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Offer ID
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.offerId }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tracking Information Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Tracking Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order ID
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.orderId || 'N/A' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Click ID
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.clickId || 'N/A' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Withdrawal ID
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.withdrawalId || 'N/A' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Additional Information Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Additional Information
            </h4>
            <div class="space-y-4">
              <div v-if="selectedConversion.reason">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rejection Reason
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.reason }}
                </p>
              </div>
              <div v-if="selectedConversion.remarks">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Remarks</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.remarks }}
                </p>
              </div>
              <div v-if="Object.keys(selectedConversion.advSubs).length > 0">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Advertiser Sub IDs</label
                >
                <div class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <pre
                    class="bg-white dark:bg-gray-800 p-2 rounded border text-xs overflow-x-auto"
                    >{{ JSON.stringify(selectedConversion.advSubs, null, 2) }}</pre
                  >
                </div>
              </div>
              <div v-if="Object.keys(selectedConversion.affSubs).length > 0">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Affiliate Sub IDs</label
                >
                <div class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <pre
                    class="bg-white dark:bg-gray-800 p-2 rounded border text-xs overflow-x-auto"
                    >{{ JSON.stringify(selectedConversion.affSubs, null, 2) }}</pre
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Timestamps Section -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Timestamps</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Created At</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.createdAt }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Updated At</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedConversion.updatedAt }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed footer with close button -->
      <div class="flex justify-end mt-4">
        <Button @click="closeViewDetailsModal" :color="'secondary'"> Close </Button>
      </div>
    </Modal>
  </AdminLayout>
</template>
