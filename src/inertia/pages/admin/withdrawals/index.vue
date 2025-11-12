<script setup lang="ts">
import AdminLayout from '~/layouts/AdminLayout.vue'
import { ref, computed, watch } from 'vue'
import { router, Head } from '@inertiajs/vue3'
import { useForm } from '@inertiajs/vue3'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import Pagination, { PaginationInterface } from '~/components/Pagination.vue'
import TextInput from '~/components/TextInput.vue'
import { useDebouncedRef } from '~/js/debounceRef'
import Button from '~/components/Button.vue'
import { ClockIcon } from '@heroicons/vue/20/solid'
import { toast, ToastOptions } from 'vue3-toastify'
import ActionReason from '#models/action_reason'
import { usePermissions } from '~/js/usePermissions'
import Modal from '~/components/Modal.vue'
import Select from '~/components/Select.vue'
import TextArea from '~/components/TextArea.vue'
import Table from '~/components/Table.vue'
import TableEmpty from '~/components/TableEmpty.vue'
import TableRow from '~/components/TableRow.vue'

// Define interfaces for type safety
interface WithdrawalHeader {
  name: string
  value: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom'
}

interface WithdrawalStatus {
  id: number
  value: string
}

interface Withdrawal {
  id: number
  withdrawalId: string
  userId: number
  userName: string
  userEmail: string
  recipientBankAccountName: string
  swiftCode: string
  amount: number
  paymentMethod: string
  status: string
  statusId: number
  remarks: string | null
  createdAt: string
  updatedAt: string
  checked: boolean
  actionReason: ActionReason | null
}

interface WithdrawalsData {
  data: Withdrawal[]
  meta: PaginationInterface
}

const props = defineProps({
  headers: { type: Array as () => WithdrawalHeader[], required: true },
  withdrawals: { type: Object as () => WithdrawalsData, required: true },
  withdrawalStatuses: { type: Array as () => WithdrawalStatus[], required: true },
  actionReasons: { type: Array as () => ActionReason[], required: true },
  nameEmail: { type: String, required: false, default: undefined },
  withdrawalId: { type: String, required: false, default: undefined },
  status: { type: Number, required: false, default: undefined },
  page: { type: Number, required: false, default: 1 },
  limit: { type: Number, required: false, default: 25 },
})

const { hasPermission, isSuperAdmin } = usePermissions()

// Set defaults for optional props
const nameEmailQuery = useDebouncedRef(props.nameEmail, 500)
const withdrawalIdQuery = useDebouncedRef(props.withdrawalId, 500)
const selectedStatus = ref(
  props.withdrawalStatuses.find((status) => status.id === parseInt(props.status?.toString() ?? '0'))
)
const selectedActionReason = ref<ActionReason | null>(null)
const remarks = ref<string | undefined>(undefined)
const page = ref(props.page)
const selectAll = ref(false)
const processing = ref(false)
const loading = ref(false)

// Confirmation dialog states
const showConfirmation = ref(false)
const confirmationAction = ref<'completed' | 'rejected' | 'processing' | 'failed' | null>(null)
const selectedCount = computed(() => form.withdrawals.length)

// Create a form for bulk actions
const form = useForm<{
  withdrawals: number[]
  statusId: number | null
  actionReasonId: number | null
  remarks: string | null
}>({
  withdrawals: [],
  statusId: null,
  actionReasonId: null,
  remarks: null,
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
    case 'amount':
      return 'currency'
    case 'createdAt':
    case 'updatedAt':
      return 'date'
    case 'status':
      return 'custom'
    default:
      return 'text'
  }
}

// Helper function to determine header alignment
const getHeaderAlignment = (value: string): 'left' | 'center' | 'right' => {
  switch (value) {
    case 'amount':
      return 'right'
    case 'status':
      return 'center'
    default:
      return 'left'
  }
}

// Handle column sorting
const handleSort = (header: WithdrawalHeader) => {
  if (!header.sortable) return

  // Implement sorting logic here
  // For now, just reload the page
  reload()
}

// Get colspan for empty state
const getColspan = computed(() => {
  let colspan = enhancedHeaders.value.length
  if (true) colspan++ // Always add 1 for selection column
  return colspan
})

// Centralized reload function similar to sellers page
const reload = () => {
  loading.value = true

  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const paramsStore: { [key: string]: string | null | undefined } = {}

  for (let searchParam of searchParams) {
    paramsStore[searchParam[0]] = searchParam[1]
  }

  if (!nameEmailQuery.value) {
    delete paramsStore['name_email']
  } else {
    const previousSearch = searchParams.get('name_email')
    const trimmedSearch = nameEmailQuery.value.trim()

    if (previousSearch !== trimmedSearch) {
      page.value = 1
    }

    paramsStore['name_email'] = trimmedSearch
  }

  if (selectedStatus.value) {
    paramsStore['status'] = selectedStatus.value.id.toString()
  } else {
    delete paramsStore['status']
  }

  if (withdrawalIdQuery.value) {
    paramsStore['withdrawal_id'] = withdrawalIdQuery.value
  } else {
    delete paramsStore['withdrawal_id']
  }

  paramsStore['page'] = page.value.toString()
  paramsStore['limit'] = props.limit.toString()

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
  nameEmailQuery.value = ''
  withdrawalIdQuery.value = ''
  selectedStatus.value = undefined
}

// Watch for changes with unified reload function - similar to sellers page
watch([nameEmailQuery, withdrawalIdQuery, selectedStatus, page], (newValues, oldValues) => {
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
})

// Navigate to a specific page - similar to sellers page
const handlePageChange = (pageNumber: number) => {
  page.value = pageNumber
}

// Check if a withdrawal can be selected (only if status is not 'rejected' or 'failed')
// Finance raised a scenario where they have received an approval of payment from bank but after few days,
// bank revert back the payment due to failed transaction.
const canSelectWithdrawal = (withdrawal: Withdrawal | null = null) => {
  if (isSuperAdmin() || hasPermission('update', 'Withdrawal')) {
    if (!withdrawal) return true // Allow selecting all if no withdrawal is provided

    return (
      withdrawal.status.toLowerCase() !== 'rejected' && withdrawal.status.toLowerCase() !== 'failed'
    )
  }

  return false
}

const computeCanSelectWithdrawal = computed(() => {
  return canSelectWithdrawal()
})

// Toggle select all withdrawals (only those with 'rejected' status)
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  if (props.withdrawals && props.withdrawals.data) {
    props.withdrawals.data.forEach((withdrawal: Withdrawal) => {
      // Only select withdrawals with 'rejected' status
      if (canSelectWithdrawal(withdrawal)) {
        withdrawal.checked = selectAll.value
      }
    })
    updateSelectedWithdrawals()
  }
}

// Update the form with selected withdrawals
const updateSelectedWithdrawals = () => {
  if (props.withdrawals && props.withdrawals.data) {
    form.withdrawals = props.withdrawals.data
      .filter((withdrawal: Withdrawal) => withdrawal.checked)
      .map((withdrawal: Withdrawal) => withdrawal.id)

    // Check if all selectable withdrawals are manually selected
    const selectableWithdrawals = props.withdrawals.data.filter((withdrawal: Withdrawal) =>
      canSelectWithdrawal(withdrawal)
    )

    const selectedSelectableWithdrawals = selectableWithdrawals.filter(
      (withdrawal: Withdrawal) => withdrawal.checked
    )

    // Update selectAll toggle if all selectable withdrawals are selected
    if (selectableWithdrawals.length > 0) {
      selectAll.value = selectedSelectableWithdrawals.length === selectableWithdrawals.length
    } else {
      selectAll.value = false
    }
  }
}

// Handle withdrawal selection
const toggleWithdrawal = (withdrawal: Withdrawal) => {
  // Only allow toggling if the withdrawal status is not 'rejected'
  if (canSelectWithdrawal(withdrawal)) {
    withdrawal.checked = !withdrawal.checked
    updateSelectedWithdrawals()
  }
}

// Export to Excel
const exportToExcel = () => {
  // Build query parameters based on current filters
  const params = new URLSearchParams()

  if (nameEmailQuery.value) {
    params.append('name_email', nameEmailQuery.value.trim())
  }

  if (withdrawalIdQuery.value) {
    params.append('withdrawal_id', withdrawalIdQuery.value.trim())
  }

  if (selectedStatus.value) {
    params.append('status', selectedStatus.value.id.toString())
  }

  // Create the export URL
  const exportUrl = `/admin/withdrawals/export?${params.toString()}`

  // Create a temporary link element to trigger the download
  const link = document.createElement('a')
  link.href = exportUrl
  link.download = '' // Let the browser use the filename from the response
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Show success toast
  toast('Excel export started!', {
    position: toast.POSITION.TOP_RIGHT,
    theme: 'colored',
    type: 'success',
    autoClose: 3000,
  } as ToastOptions)
}

// Computed property to check if any withdrawals are selected
const hasSelectedWithdrawals = computed(() => {
  return form.withdrawals.length > 0
})

// Show confirmation dialog for completing withdrawals
const confirmCompleted = () => {
  if (!hasSelectedWithdrawals.value) return
  confirmationAction.value = 'completed'
  showConfirmation.value = true
}

// Show confirmation dialog for processing withdrawals
const confirmProcessing = () => {
  if (!hasSelectedWithdrawals.value) return
  confirmationAction.value = 'processing'
  showConfirmation.value = true
}

// Show confirmation dialog for rejecting withdrawals
const confirmRejected = () => {
  if (!hasSelectedWithdrawals.value) return
  confirmationAction.value = 'rejected'
  selectedActionReason.value = null // Reset action reason when opening dialog
  remarks.value = undefined // Reset remarks when opening dialog
  showConfirmation.value = true
}

// Show confirmation dialog for marking withdrawals as failed
const confirmFailed = () => {
  if (!hasSelectedWithdrawals.value) return
  confirmationAction.value = 'failed'
  selectedActionReason.value = null // Reset action reason when opening dialog
  remarks.value = undefined // Reset remarks when opening dialog
  showConfirmation.value = true
}

// Reset confirmation dialog
const closeConfirmation = () => {
  showConfirmation.value = false
  selectedActionReason.value = null
  remarks.value = undefined
  confirmationAction.value = null
}

// Mark selected withdrawals based on action type
const markWithdrawals = async () => {
  showConfirmation.value = false
  processing.value = true

  // Validate action reason is selected for rejection or failed
  if (
    (confirmationAction.value === 'rejected' || confirmationAction.value === 'failed') &&
    !selectedActionReason.value
  ) {
    alert(`Please select a reason for ${confirmationAction.value}`)
    processing.value = false
    showConfirmation.value = true
    return
  }

  // Validate remarks is provided when "Others" is selected
  if (
    (confirmationAction.value === 'rejected' || confirmationAction.value === 'failed') &&
    selectedActionReason.value?.reason === 'Others' &&
    (!remarks.value || !remarks.value.trim())
  ) {
    alert('Please specify the reason when "Others" is selected')
    processing.value = false
    showConfirmation.value = true
    return
  }

  let statusToFind: string
  switch (confirmationAction.value) {
    case 'completed':
      statusToFind = 'completed'
      break
    case 'rejected':
      statusToFind = 'rejected'
      break
    case 'processing':
      statusToFind = 'processing'
      break
    case 'failed':
      statusToFind = 'failed'
      break
    default:
      alert('Invalid action type')
      processing.value = false
      return
  }

  // Find the status ID
  const targetStatus = props.withdrawalStatuses?.find(
    (status: WithdrawalStatus) => status.value === statusToFind
  )

  if (!targetStatus) {
    alert(`Could not find the ${statusToFind} status`)
    processing.value = false
    return
  }

  form.statusId = targetStatus.id

  // Set action reason ID if rejecting or marking as failed
  if (
    (confirmationAction.value === 'rejected' || confirmationAction.value === 'failed') &&
    selectedActionReason.value
  ) {
    form.actionReasonId = selectedActionReason.value.id
  }

  // Set remarks if provided
  if (remarks.value && remarks.value.trim()) {
    form.remarks = remarks.value.trim()
  } else {
    form.remarks = null
  }

  let payload: {
    statusId: number
    withdrawals: number[]
    actionReasonId: number | null
    remarks: string | null
    status?: number
  } = {
    statusId: targetStatus.id,
    withdrawals: form.withdrawals,
    actionReasonId: form.actionReasonId,
    remarks: form.remarks,
  }

  if (props.status) {
    payload.status = props.status
  }

  router.post('/admin/withdrawals', payload, {
    onFinish: () => {
      selectAll.value = false
      form.reset()
      selectedActionReason.value = null
      remarks.value = undefined
      processing.value = false
      confirmationAction.value = null
      reload()
    },
    onError: () => {
      processing.value = false
    },
  })
}

// Get confirmation dialog content based on action
const getConfirmationContent = () => {
  switch (confirmationAction.value) {
    case 'completed':
      return {
        title: 'Confirm Completion',
        message: `Are you sure you want to mark ${selectedCount.value} withdrawal${
          selectedCount.value !== 1 ? 's' : ''
        } as completed? This action cannot be undone.`,
        icon: CheckIcon,
        iconClass: 'text-green-600',
        bgClass: 'bg-green-100',
        buttonClass: 'bg-green-600 hover:bg-green-500',
        buttonText: 'Confirm',
      }
    case 'rejected':
      return {
        title: 'Confirm Rejection',
        message: `Are you sure you want to mark ${selectedCount.value} withdrawal${
          selectedCount.value !== 1 ? 's' : ''
        } as rejected? This action cannot be undone.`,
        icon: XMarkIcon,
        iconClass: 'text-red-600',
        bgClass: 'bg-red-100',
        buttonClass: 'bg-red-600 hover:bg-red-500',
        buttonText: 'Confirm',
      }
    case 'processing':
      return {
        title: 'Confirm Processing',
        message: `Are you sure you want to mark ${selectedCount.value} withdrawal${
          selectedCount.value !== 1 ? 's' : ''
        } as processing?`,
        icon: ClockIcon,
        iconClass: 'text-yellow-600',
        bgClass: 'bg-yellow-100',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-500',
        buttonText: 'Confirm',
      }
    case 'failed':
      return {
        title: 'Confirm Failed Status',
        message: `Are you sure you want to mark ${selectedCount.value} withdrawal${
          selectedCount.value !== 1 ? 's' : ''
        } as failed? This action cannot be undone.`,
        icon: XMarkIcon,
        iconClass: 'text-red-600',
        bgClass: 'bg-red-100',
        buttonClass: 'bg-red-600 hover:bg-red-500',
        buttonText: 'Confirm',
      }
    default:
      return {
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
        icon: CheckIcon,
        iconClass: 'text-gray-600',
        bgClass: 'bg-gray-100',
        buttonClass: 'bg-gray-600 hover:bg-gray-500',
        buttonText: 'Confirm',
      }
  }
}

// Get selected withdrawal statuses
const selectedWithdrawalStatuses = computed(() => {
  if (!props.withdrawals?.data) return []

  const selected = props.withdrawals.data
    .filter((withdrawal: Withdrawal) => withdrawal.checked)
    .map((withdrawal: Withdrawal) => withdrawal.status.toLowerCase())

  return selected
})

// Check if all selected withdrawals have the same status
const allSelectedHaveSameStatus = computed(() => {
  const statuses = selectedWithdrawalStatuses.value
  if (statuses.length === 0) return false
  return statuses.every((status) => status === statuses[0])
})

// Check if button should be hidden based on selected withdrawal statuses
const shouldHideButton = (buttonStatus: string) => {
  const selectedStatuses = selectedWithdrawalStatuses.value
  if (selectedStatuses.length === 0) return false

  // If all selected withdrawals have the same status, hide the button if it matches
  if (allSelectedHaveSameStatus.value) {
    return selectedStatuses[0] === buttonStatus.toLowerCase()
  }

  // If multiple different statuses are selected, hide buttons that match any of the selected statuses
  return selectedStatuses.includes(buttonStatus.toLowerCase())
}

// Get filtered action reasons based on confirmation action
const filteredActionReasons = computed(() => {
  if (confirmationAction.value === 'rejected') {
    return props.actionReasons.filter((reason) => reason.type === 'rejected_withdrawal')
  } else if (confirmationAction.value === 'failed') {
    return props.actionReasons.filter((reason) => reason.type === 'failed_withdrawal')
  }
  return []
})

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'requested':
      return 'bg-blue-100 text-blue-800'
    case 'rejected':
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <AdminLayout>
    <Head title="Withdrawals Management" />
    <div class="p-3">
      <div class="sm:flex sm:items-center mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
            Withdrawals
          </h1>
        </div>
      </div>
      <div class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mt-2">
        <TextInput
          class="lg:col-span-2"
          type="text"
          v-model="nameEmailQuery"
          :disabled="loading"
          placeholder="Search by name or email"
        />

        <TextInput
          class="lg:col-span-2"
          type="text"
          v-model="withdrawalIdQuery"
          :disabled="loading"
          placeholder="Search by withdrawal ID"
        />

        <Select
          class="lg:col-span-1"
          v-model="selectedStatus"
          :items="withdrawalStatuses"
          :option-label="
            (status: any) =>
              `${status.value.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())}`
          "
          placeholder="Status"
        />

        <div class="lg:col-span-2 flex justify-between lg:justify-end lg:gap-2">
          <Button
            v-if="hasPermission('read', 'Withdrawal')"
            @click="exportToExcel"
            :disabled="loading"
          >
            Export
          </Button>
          <Button @click="resetFilters" :disabled="loading" :color="'primary'">Reset</Button>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div
        class="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        v-show="selectedCount > 0 || computeCanSelectWithdrawal"
      >
        <div class="flex gap-2">
          <Button
            v-show="!shouldHideButton('completed')"
            :disabled="!hasSelectedWithdrawals || processing || loading"
            :color="'success'"
            @click="confirmCompleted"
          >
            <CheckIcon class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Mark as Completed
          </Button>
          <Button
            v-show="!shouldHideButton('processing')"
            :disabled="!hasSelectedWithdrawals || processing || loading"
            :color="'warning'"
            @click="confirmProcessing"
          >
            <ClockIcon class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Mark as Processing
          </Button>
          <Button
            v-show="!shouldHideButton('rejected')"
            :disabled="!hasSelectedWithdrawals || processing || loading"
            :color="'danger'"
            @click="confirmRejected"
          >
            <XMarkIcon class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Mark as Rejected
          </Button>
          <Button
            v-show="!shouldHideButton('failed')"
            :disabled="!hasSelectedWithdrawals || processing || loading"
            :color="'danger'"
            @click="confirmFailed"
          >
            <XMarkIcon class="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Mark as Failed
          </Button>
        </div>
      </div>

      <!-- Table -->
      <Table
        :headers="enhancedHeaders"
        :selectable="canSelectWithdrawal()"
        :can-select-all="canSelectWithdrawal()"
        :select-all="selectAll"
        :current-sort="{ by: 'createdAt', order: 'desc' }"
        @select-all-change="toggleSelectAll"
        @sort="handleSort"
      >
        <template #body="{ selectable }">
          <!-- Empty state -->
          <TableEmpty
            v-if="!withdrawals?.data?.length"
            :colspan="getColspan"
            title="No withdrawals found"
            description="Try adjusting your search criteria or filters"
          />

          <!-- Table rows with custom cell content -->
          <TableRow
            v-else
            v-for="withdrawal in withdrawals?.data || []"
            :key="withdrawal.id"
            :headers="enhancedHeaders"
            :data="withdrawal"
            :selectable="selectable"
            :select-disabled="!canSelectWithdrawal(withdrawal)"
            :selected="withdrawal.checked"
            @select-change="toggleWithdrawal(withdrawal)"
          >
            <template #cell-id="{ data }">
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {{ data.withdrawalId }}
              </span>
            </template>

            <!-- User Email with tooltip -->
            <template #cell-userEmail="{ data }">
              <div class="relative group">
                <span class="block max-w-[20ch] truncate cursor-help">
                  {{ data.userEmail }}
                </span>
                <div
                  v-if="data.userEmail && data.userEmail.length > 20"
                  class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                >
                  {{ data.userEmail }}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Bank Account Name with tooltip -->
            <template #cell-recipientBankAccountName="{ data }">
              <div class="relative group">
                <span class="block max-w-[20ch] truncate cursor-help">
                  {{ data.recipientBankAccountName }}
                </span>
                <div
                  v-if="data.recipientBankAccountName && data.recipientBankAccountName.length > 20"
                  class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                >
                  {{ data.recipientBankAccountName }}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Status with tooltip -->
            <template #cell-status="{ data }">
              <span
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium gap-2 relative group"
                :class="getStatusColor(data.status)"
              >
                {{ data.status }}
                <span
                  v-if="data.actionReason"
                  class="absolute left-1/2 -translate-x-1/2 top-full mt-2 max-w-xs w-64 z-20 rounded bg-gray-700 p-2 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal break-words"
                >
                  {{
                    data.actionReason.reason.toLowerCase() === 'others'
                      ? data.remarks
                      : data.actionReason.reason
                  }}
                </span>
              </span>
            </template>
          </TableRow>
        </template>
      </Table>

      <!-- Pagination -->
      <Pagination
        v-if="props.withdrawals?.meta"
        :paginations="props.withdrawals.meta"
        class="my-5"
        @change-page="handlePageChange"
      />
    </div>

    <!-- Confirmation Dialog using shared Modal component -->
    <Modal :show="showConfirmation" @close="closeConfirmation" max-width="2xl">
      <template #title>
        {{ getConfirmationContent().title }}
      </template>

      <div class="sm:flex sm:items-start">
        <div
          class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10"
          :class="getConfirmationContent().bgClass"
        >
          <component
            :is="getConfirmationContent().icon"
            class="h-6 w-6"
            :class="getConfirmationContent().iconClass"
            aria-hidden="true"
          />
        </div>
        <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
          <div class="mt-2">
            <p class="text-sm text-gray-500 dark:text-gray-300">
              {{ getConfirmationContent().message }}
            </p>
          </div>

          <!-- Action Reason Dropdown for Rejection or Failed -->
          <div
            v-if="confirmationAction === 'rejected' || confirmationAction === 'failed'"
            class="mt-4"
          >
            <label
              for="action-reason"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Reason for {{ confirmationAction === 'rejected' ? 'Rejection' : 'Failure'
              }}<span class="text-red-500">*</span>
            </label>

            <Select
              v-model="selectedActionReason"
              :items="filteredActionReasons"
              :disabled="loading"
              option-label="reason"
              placeholder="Select Reason"
            />
          </div>

          <!-- Reason Input Field for Rejection or Failed (only shown when "Others" is selected) -->
          <div
            v-if="
              (confirmationAction === 'rejected' || confirmationAction === 'failed') &&
              selectedActionReason?.reason.toLowerCase() === 'others'
            "
            class="mt-4"
          >
            <TextArea
              v-model="remarks"
              label="Reason"
              placeholder="Please specify the reason..."
              :rows="3"
              :disabled="loading"
            />
          </div>
        </div>
      </div>
      <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          :class="getConfirmationContent().buttonClass"
          :disabled="
            (confirmationAction === 'rejected' || confirmationAction === 'failed') &&
            (!selectedActionReason ||
              (selectedActionReason?.reason.toLowerCase() === 'others' &&
                (!remarks || !remarks.trim())))
          "
          @click="markWithdrawals"
        >
          {{ getConfirmationContent().buttonText }}
        </button>
        <button
          type="button"
          class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          @click="closeConfirmation"
        >
          Cancel
        </button>
      </div>
    </Modal>
  </AdminLayout>
</template>
