<script setup lang="ts">
import AdminLayout from '~/layouts/AdminLayout.vue'
import { ref, watch, computed } from 'vue'
import { router, Head } from '@inertiajs/vue3'
import { EyeIcon } from '@heroicons/vue/24/outline'
import Pagination, { PaginationInterface } from '~/components/Pagination.vue'
import TextInput from '~/components/TextInput.vue'
import TextArea from '~/components/TextArea.vue'
import Modal from '~/components/Modal.vue'
import Select from '~/components/Select.vue'
import Button from '~/components/Button.vue'
import { default as Table } from '~/components/Table.vue'
import { default as TableRow } from '~/components/TableRow.vue'
import { default as TableEmpty } from '~/components/TableEmpty.vue'
import { useDebouncedRef } from '~/js/debounceRef'
import { toast, ToastOptions } from 'vue3-toastify'

// Define interfaces for type safety
interface MissingCashbackStatus {
  id: number
  value: string
}

interface MissingCashback {
  id: number
  userId: number
  userName: string
  email: string | null
  clickId: string
  orderId: string | null
  status: string
  statusId: number
  remarks: string | null
  createdAt: string
  updatedAt: string
  productName: string
}

interface MissingCashbacksData {
  data: MissingCashback[]
  meta: PaginationInterface
}

const props = defineProps({
  missingCashbacks: { type: Object as () => MissingCashbacksData, required: true },
  missingCashbackStatuses: { type: Array as () => MissingCashbackStatus[], required: true },
  search: { type: String, required: false, default: undefined },
  status: { type: Number, required: false, default: undefined },
  sortBy: { type: String, required: false, default: 'created_at' },
  sortOrder: { type: String, required: false, default: 'desc' },
  page: { type: Number, required: false, default: 1 },
  limit: { type: Number, required: false, default: 25 },
})

// Set defaults for optional props
const searchQuery = useDebouncedRef(props.search, 500)
const selectedStatus = ref(
  props.missingCashbackStatuses.find(
    (status) => status.id === parseInt(props.status?.toString() ?? '0')
  )
)

const loading = ref(false)

// Sorting state
const currentSortBy = ref(props.sortBy)
const currentSortOrder = ref(props.sortOrder)

// Details modal state
const showDetailsModal = ref(false)
const selectedMissingCashback = ref<MissingCashback | null>(null)

// Remarks and Status update state
const showRemarksModal = ref(false)
const showStatusModal = ref(false)
const selectedMissingCashbackForUpdate = ref<MissingCashback | null>(null)
const newRemarks = ref('')
const newStatus = ref<MissingCashbackStatus | null>(null)
const updatingMissingCashback = ref(false)
const page = ref(props.page)

// Enhanced headers for Table component
const enhancedHeaders = computed(() => [
  { name: 'Report Date', value: 'createdAt', sortable: true, type: 'datetime' },
  { name: 'User Name', value: 'userName', sortable: false, type: 'text' },
  { name: 'Order ID', value: 'orderId', sortable: false, type: 'text' },
  { name: 'Status', value: 'status', sortable: false, type: 'custom', align: 'center' as const },
  { name: 'Remarks', value: 'remarks', sortable: false, type: 'text' },
  { name: 'Updated At', value: 'updatedAt', sortable: true, type: 'datetime' },
])

// Current sort state for Table component
const currentSort = computed(() => ({
  by: currentSortBy.value,
  order: currentSortOrder.value as 'asc' | 'desc',
}))

// Get colspan for empty state
const getColspan = computed(() => {
  return enhancedHeaders.value.length + 1 // +1 for actions column
})

// Watch for changes in page prop to sync local state
watch(
  () => props.page,
  (newPage) => {
    page.value = newPage
  }
)

// Watch for changes in search prop to sync local state
watch(
  () => props.search,
  (newSearch) => {
    searchQuery.value = newSearch
  }
)

// Watch for changes in status prop to sync local state
watch(
  () => props.status,
  (newStatus) => {
    selectedStatus.value = props.missingCashbackStatuses.find(
      (status) => status.id === parseInt(newStatus?.toString() ?? '0')
    )
  }
)

// Watch for changes in sortBy prop to sync local state
watch(
  () => props.sortBy,
  (newSortBy) => {
    currentSortBy.value = newSortBy
  }
)

// Watch for changes in sortOrder prop to sync local state
watch(
  () => props.sortOrder,
  (newSortOrder) => {
    currentSortOrder.value = newSortOrder
  }
)

// Centralized reload function
const reload = () => {
  loading.value = true

  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const paramsStore: { [key: string]: string | null | undefined } = {}

  for (let searchParam of searchParams) {
    paramsStore[searchParam[0]] = searchParam[1]
  }

  if (!searchQuery.value) {
    delete paramsStore['search']
  } else {
    const previousSearch = searchParams.get('search')
    const trimmedSearch = searchQuery.value.trim()

    if (previousSearch !== trimmedSearch) {
      page.value = 1
    }

    paramsStore['search'] = trimmedSearch
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

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = undefined
}

// Watch for changes with unified reload function
watch(
  [searchQuery, selectedStatus, page, currentSortBy, currentSortOrder],
  (newValues, oldValues) => {
    let filterHasChanged = false
    // Check if search or status filter has changed (indices 0-1)
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

// Handle sorting from Table component
const handleSort = (header: { value: string }) => {
  if (currentSortBy.value === header.value) {
    currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortBy.value = header.value
    currentSortOrder.value = 'desc'
  }
}

// Details functions
const openDetailsModal = (missingCashback: MissingCashback) => {
  selectedMissingCashback.value = missingCashback
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedMissingCashback.value = null
}

// Remarks and Status update functions
const openRemarksModal = (missingCashback: MissingCashback) => {
  selectedMissingCashbackForUpdate.value = missingCashback
  newRemarks.value = missingCashback.remarks || ''
  showRemarksModal.value = true
}

const closeRemarksModal = () => {
  showRemarksModal.value = false
  selectedMissingCashbackForUpdate.value = null
  newRemarks.value = ''
  updatingMissingCashback.value = false
}

const openStatusModal = (missingCashback: MissingCashback) => {
  selectedMissingCashbackForUpdate.value = missingCashback
  newStatus.value =
    props.missingCashbackStatuses.find((s) => s.id === missingCashback.statusId) || null
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  selectedMissingCashbackForUpdate.value = null
  newStatus.value = null
  updatingMissingCashback.value = false
}

const updateMissingCashback = async () => {
  if (!selectedMissingCashbackForUpdate.value) return

  updatingMissingCashback.value = true

  try {
    const payload: { remarks?: string; statusId?: number } = {}

    if (showRemarksModal.value) {
      payload.remarks = newRemarks.value
    }

    if (showStatusModal.value && newStatus.value) {
      payload.statusId = newStatus.value.id
    }

    router.patch(
      `/admin/missing-cashbacks/${selectedMissingCashbackForUpdate.value.id}/update`,
      payload,
      {
        onSuccess: () => {
          toast('Updated successfully', { type: 'success' } as ToastOptions)
          closeRemarksModal()
          closeStatusModal()
        },
        onError: (errors) => {
          console.error('Update errors:', errors)
          toast('Failed to update', { type: 'error' } as ToastOptions)
        },
        onFinish: () => {
          updatingMissingCashback.value = false
        },
      }
    )
  } catch (error) {
    console.error('Update error:', error)
    toast('Failed to update', { type: 'error' } as ToastOptions)
    updatingMissingCashback.value = false
  }
}

// Copy to clipboard function
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast('Copied to clipboard', { type: 'success' } as ToastOptions)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    toast('Failed to copy to clipboard', { type: 'error' } as ToastOptions)
  }
}
</script>

<template>
  <Head title="Missing Cashbacks" />

  <AdminLayout>
    <div class="p-3">
      <div class="sm:flex sm:items-center mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
            Missing Cashbacks
          </h1>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        <!-- Search -->
        <TextInput
          class="lg:col-span-2"
          id="search"
          v-model="searchQuery"
          type="text"
          placeholder="Search by click ID, order ID, email or name"
        />

        <Select
          class="lg:col-span-1"
          v-model="selectedStatus"
          :items="missingCashbackStatuses"
          :option-label="
            (status: any) =>
              `${status.value.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())}`
          "
          placeholder="Status"
        />

        <div class="flex justify-end">
          <Button @click="resetFilters" :disabled="loading" :color="'primary'"> Reset </Button>
        </div>
      </div>

      <!-- Table -->
      <Table
        :headers="enhancedHeaders"
        :show-actions="true"
        :current-sort="currentSort"
        @sort="handleSort"
      >
        <template #body="{ headers, showActions }">
          <!-- Empty state -->
          <TableEmpty
            v-if="!missingCashbacks?.data?.length"
            :colspan="getColspan"
            title="No missing cashbacks found"
            description="Try adjusting your search criteria or filters"
          />

          <!-- Table rows -->
          <TableRow
            v-else
            v-for="item in missingCashbacks.data"
            :key="item.id"
            :headers="headers"
            :data="item"
            :show-actions="showActions"
          >
            <!-- Custom cell for userName -->
            <template #cell-userName="{ data }">
              <div class="relative group">
                <span class="block max-w-[20ch] truncate cursor-help">
                  {{ data.userName }}
                </span>
                <div
                  v-if="data.userName && data.userName.length > 20"
                  class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                >
                  {{ data.userName }}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Custom cell for orderId -->
            <template #cell-orderId="{ data }">
              <div class="relative group">
                <span class="block max-w-[20ch] truncate cursor-help">
                  {{ data.orderId || 'N/A' }}
                </span>
                <div
                  v-if="data.orderId && data.orderId.length > 20"
                  class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                >
                  {{ data.orderId }}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Custom cell for status -->
            <template #cell-status="{ data }">
              <span
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium gap-2 relative group"
                :class="{
                  'bg-yellow-100 text-yellow-800': data.status.toLowerCase() === 'open',
                  'bg-green-100 text-green-800': data.status.toLowerCase() === 'done',
                  'bg-indigo-100 text-indigo-800': data.status.toLowerCase() === 'ongoing',
                }"
              >
                {{ data.status }}
              </span>
            </template>

            <!-- Custom cell for remarks -->
            <template #cell-remarks="{ data }">
              <div class="relative group">
                <span class="block max-w-[30ch] truncate cursor-help">
                  {{ data.remarks || '' }}
                </span>
                <div
                  v-if="data.remarks"
                  class="absolute left-1/2 -translate-x-1/2 top-full mt-2 max-w-xs w-64 z-50 rounded bg-gray-700 p-2 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal break-words"
                >
                  {{ data.remarks }}
                </div>
              </div>
            </template>

            <!-- Actions -->
            <template #actions="{ data }">
              <div class="flex space-x-2">
                <button
                  @click="openDetailsModal(data as MissingCashback)"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="View Details"
                >
                  <EyeIcon class="h-4 w-4 mr-1" />
                  Details
                </button>
                <button
                  @click="openRemarksModal(data as MissingCashback)"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  title="Add/Edit Remarks"
                >
                  Add Remarks
                </button>
                <button
                  @click="openStatusModal(data as MissingCashback)"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  title="Change Status"
                >
                  Change Status
                </button>
              </div>
            </template>
          </TableRow>
        </template>
      </Table>

      <!-- Pagination -->
      <div class="mt-6">
        <Pagination
          v-if="missingCashbacks?.meta"
          :paginations="missingCashbacks.meta"
          @change-page="handlePageChange"
        />
      </div>
    </div>

    <!-- Details Modal -->
    <Modal :show="showDetailsModal" @close="closeDetailsModal" max-width="4xl">
      <template #title> Missing Cashback Details </template>

      <div class="min-h-auto max-h-[80vh] flex flex-col">
        <!-- Scrollable content area -->
        <div class="flex-1 overflow-y-auto space-y-6">
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-600">User Name:</span>
                <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {{ selectedMissingCashback?.userName }}
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">User Email:</span>
                <div class="flex items-center mt-1 space-x-2">
                  <p class="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">
                    {{ selectedMissingCashback?.email || 'N/A' }}
                  </p>
                  <button
                    v-if="selectedMissingCashback?.email"
                    @click="copyToClipboard(selectedMissingCashback.email)"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Copy email"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Product Name:</span>
                <p
                  class="text-sm text-gray-900 dark:text-gray-100 mt-1 truncate"
                  :title="selectedMissingCashback?.productName || 'N/A'"
                >
                  {{ selectedMissingCashback?.productName || 'N/A' }}
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Status:</span>
                <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium gap-2 relative group"
                    :class="{
                      'bg-yellow-100 text-yellow-800':
                        selectedMissingCashback?.status.toLowerCase() === 'open',
                      'bg-green-100 text-green-800':
                        selectedMissingCashback?.status.toLowerCase() === 'done',
                      'bg-indigo-100 text-indigo-800':
                        selectedMissingCashback?.status.toLowerCase() === 'ongoing',
                    }"
                  >
                    {{ selectedMissingCashback?.status }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Transaction Details
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-600">Click ID:</span>
                <div class="flex items-center mt-1 space-x-2">
                  <p
                    class="text-sm text-gray-900 dark:text-gray-100 font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate"
                  >
                    {{ selectedMissingCashback?.clickId }}
                  </p>
                  <button
                    @click="copyToClipboard(selectedMissingCashback?.clickId!)"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Copy click ID"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Order ID:</span>
                <div class="flex items-center mt-1 space-x-2">
                  <p
                    class="text-sm text-gray-900 dark:text-gray-100 font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate"
                  >
                    {{ selectedMissingCashback?.orderId || 'N/A' }}
                  </p>
                  <button
                    v-if="selectedMissingCashback?.orderId"
                    @click="copyToClipboard(selectedMissingCashback.orderId!)"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Copy order ID"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timeline</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-600">Created At:</span>
                <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {{ selectedMissingCashback?.createdAt }}
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Last Updated:</span>
                <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {{ selectedMissingCashback?.updatedAt }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="selectedMissingCashback?.remarks"
            class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg"
          >
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Remarks</h4>
            <div class="bg-white dark:bg-gray-700 p-4 rounded border">
              <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {{ selectedMissingCashback.remarks }}
              </p>
            </div>
          </div>
        </div>

        <!-- Fixed footer with close button -->
        <div class="flex justify-end mt-6">
          <Button color="secondary" @click="closeDetailsModal">Close</Button>
        </div>
      </div>
    </Modal>

    <!-- Remarks Modal -->
    <Modal :show="showRemarksModal" @close="closeRemarksModal" max-width="2xl">
      <template #title>
        Update Remarks for {{ selectedMissingCashbackForUpdate?.userName }}
      </template>

      <div class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Missing Cashback Details
          </h4>
          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">Product Name:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.productName || 'N/A' }}</span>
            </div>
            <div>
              <span class="font-medium">Click ID:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.clickId }}</span>
            </div>
            <div>
              <span class="font-medium">Order ID:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.orderId || 'N/A' }}</span>
            </div>
            <div>
              <span class="font-medium">Current Status:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.status }}</span>
            </div>
          </div>
        </div>

        <TextArea
          v-model="newRemarks"
          label="Remarks"
          placeholder="Enter remarks for this missing cashback..."
          :rows="6"
        />

        <div class="flex justify-end space-x-3 pt-4">
          <Button color="secondary" @click="closeRemarksModal" :disabled="updatingMissingCashback">
            Cancel
          </Button>
          <Button
            color="primary"
            @click="updateMissingCashback"
            :disabled="updatingMissingCashback || newRemarks.length === 0"
          >
            <span v-if="updatingMissingCashback">Updating...</span>
            <span v-else>Update Remarks</span>
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Status Modal -->
    <Modal :show="showStatusModal" @close="closeStatusModal" max-width="2xl">
      <template #title>
        Change Status for {{ selectedMissingCashbackForUpdate?.userName }}
      </template>

      <div class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Missing Cashback Details
          </h4>
          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">Product Name:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.productName || 'N/A' }}</span>
            </div>
            <div>
              <span class="font-medium">Click ID:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.clickId }}</span>
            </div>
            <div>
              <span class="font-medium">Order ID:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.orderId || 'N/A' }}</span>
            </div>
            <div>
              <span class="font-medium">Current Status:</span>
              <span class="ml-2">{{ selectedMissingCashbackForUpdate?.status }}</span>
            </div>
          </div>
        </div>

        <div>
          <label
            for="status"
            class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
            >New Status
          </label>
          <Select
            v-model="newStatus"
            :items="missingCashbackStatuses"
            :option-label="
              (s: any) => s.value.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())
            "
            placeholder="Select status"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button color="secondary" @click="closeStatusModal" :disabled="updatingMissingCashback">
            Cancel
          </Button>
          <Button
            color="primary"
            @click="updateMissingCashback"
            :disabled="updatingMissingCashback || !newStatus"
          >
            <span v-if="updatingMissingCashback">Updating...</span>
            <span v-else>Update Status</span>
          </Button>
        </div>
      </div>
    </Modal>
  </AdminLayout>
</template>
