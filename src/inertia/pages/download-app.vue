<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import Header from '~/components/Homepage/Header.vue'
import QRDownload from '~/components/Homepage/Sections/QRDownload.vue'
import Footer from '~/components/Homepage/Footer.vue'
</script>

<template>
  <Head title="Download Cashiu App" />
  <main class="relative min-h-screen w-full bg-primary-50 flex flex-col">
    <Header />
    <div class="flex-1 flex flex-col relative w-full">
      <QRDownload />
    </div>
    <Footer />
  </main>
</template>
