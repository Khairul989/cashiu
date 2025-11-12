<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer
    class="flex justify-between items-start lg:items-center w-full h-10 z-10 px-4"
  >
    <div
      class="leading-3 text-gray-600 text-xs font-medium"
    >
      <span>
        © {{ year }} Cashiu! Shop & Get Cashback by Commerce Media Ventures Sdn Bhd
      </span>

      <span class="mx-1 align-[0.25rem]"> . </span>

      <a
        href="/privacy-policy"
        target="_blank"
      >
        Privacy Policy
      </a>

      <span class="mx-1 align-[0.25rem]"> . </span>

      <a
        href="/terms-of-use"
        target="_blank"
      >
        Terms of Use
      </a>

      <span class="mx-1 align-[0.25rem]"> . </span>

      <a
        href="/whitelabel"
        target="_blank"
      >
        Whitelabel
      </a>
    </div>
  </footer>
</template>
