<script setup lang="ts">
import WrapperSwiper from '~/components/Homepage/WrapperSwiper.vue'
import Wrapper from '~/components/Homepage/Wrapper.vue'

import boxesHeroAsset from '~/assets/homepage/boxes-hero.svg'
import boxesInstructionAsset from '~/assets/homepage/boxes-instruction.svg'

import exactCashbackEarnings from '~/assets/homepage/slider/exact-cashback-earnings.svg'
import shopFromVerifiedSellers from '~/assets/homepage/slider/shop-from-verified-sellers.svg'
import clearCashbackBreakdown from '~/assets/homepage/slider/clear-cashback-breakdown.svg'

const data: { title: string; description: string; image: string }[] = [
  {
    title: 'Exact Cashback Earnings',
    description: 'What you\'ll see is what you\'ll get.',
    image: exactCashbackEarnings,
  },
  {
    title: 'Shop from verified sellers',
    description: 'Purchase authentic products only.',
    image: shopFromVerifiedSellers,
  },
  {
    title: 'Clear Cashback breakdown',
    description: 'Track all cashback transactions before withdrawing.',
    image: clearCashbackBreakdown,
  },
];
</script>

<template>
  <Wrapper>
    <WrapperSwiper :data="data">
      <template #title>
        <div class="hidden lg:flex flex-col lg:text-5xl xl:text-6xl font-bold">
          <span class="text-black">
            Earn with
          </span>

          <span class="text-marine-700">
            Complete
          </span>
          <span class="text-marine-700">
            Transparency
          </span>
        </div>

        <div class="flex lg:hidden flex-col text-2xl sm:text-3xl md:text-4xl text-center font-bold">
          <span class="text-black">
            Earn with
          </span>

          <span class="text-marine-700">
            Complete Transparency
          </span>
        </div>
      </template>
    </WrapperSwiper>

    <div class="absolute
      -top-8 sm:-top-10 md:-top-12 lg:-top-14 xl:-top-16  
      left-8 sm:left-10 md:left-12 lg:left-16 xl:-left-20">
      <img :src="boxesHeroAsset" alt="boxes-hero"
        class="w-[5.531rem] h-[5.298rem] sm:w-[8rem] sm:h-[8rem] md:w-[12rem] md:h-[12rem] lg:w-[16rem] lg:h-[15rem] xl:w-[19.875rem] xl:h-[19.034rem]" />
    </div>

    <div class="absolute -right-4 sm:-right-8 md:-right-12 lg:-right-16 xl:-right-24 lg:-bottom-[6rem]">
      <img :src="boxesInstructionAsset" alt="boxes-instruction"
        class="w-[5.5625rem] h-[7.201rem] sm:w-[7rem] sm:h-[9rem] md:w-[9rem] md:h-[12rem] lg:w-[12rem] lg:h-[15rem] xl:w-[14.085rem] xl:h-[18.235rem]" />
    </div>
  </Wrapper>
</template>
