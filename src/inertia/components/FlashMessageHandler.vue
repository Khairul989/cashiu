<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { toast, ToastOptions } from 'vue3-toastify'

interface FlashMessages {
  success?: string
  error?: string
  warning?: string
  info?: string
}

const { props } = usePage<{ flash: FlashMessages }>()

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  const options: ToastOptions = {
    position: toast.POSITION.TOP_RIGHT,
    theme: 'colored',
    type,
    autoClose: 5000,
  }

  toast(message, options)
}

const handleFlashMessages = (flash: FlashMessages) => {
  if (!flash) return

  if (flash.success) {
    showToast(flash.success, 'success')
  }

  if (flash.error) {
    showToast(flash.error, 'error')
  }

  if (flash.warning) {
    showToast(flash.warning, 'warning')
  }

  if (flash.info) {
    showToast(flash.info, 'info')
  }
}

// Watch for flash messages on page load
onMounted(() => {
  if (props.flash) {
    handleFlashMessages(props.flash)
  }
})

// Watch for flash messages changes
watch(() => props.flash, (newFlash) => {
  if (newFlash) {
    handleFlashMessages(newFlash)
  }
}, { deep: true })
</script>

<template>
  <!-- This component doesn't render anything, it just handles flash messages -->
</template> 