<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { onMounted } from 'vue'

import Header from '~/components/Homepage/Header.vue'
import Hero from '~/components/Homepage/Sections/Hero.vue'
import Instruction from '~/components/Homepage/Sections/Instruction.vue'
import EasyCashback from '~/components/Homepage/Sections/EasyCashback.vue'
import Footer from '~/components/Homepage/Footer.vue'
import FlashMessageHandler from '~/components/FlashMessageHandler.vue'

onMounted(() => {
  document.body.classList.add('overflow-x-hidden', "overflow-y-scroll", "no-scrollbar")
  document.documentElement.classList.add("overflow-y-scroll", "no-scrollbar")
})
</script>

<template>
  <Head
    title="Cashiu | Earn Cashback from Shopee Online Shopping"
    description="Shop online at Shopee through Cashiu and earn high cashback rewards on every purchase. Track your cashback in and outs easily. Download Cashiu now!"
  />

  <main 
    class="relative bg-primary-50"
  >
    <Header />
    <Hero />
    <Instruction />
    <EasyCashback />
    
    <div class="h-16 md:h-24"></div>
    
    <Footer />
  </main>
  
  <!-- Global flash message handler -->
  <FlashMessageHandler />
</template>
