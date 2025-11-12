<script setup lang="ts">
import WrapperSwiper from '~/components/Homepage/WrapperSwiper.vue'
import Wrapper from '~/components/Homepage/Wrapper.vue'

import cashAsset from '~/assets/homepage/cash.svg'
import lifebouyInvertedAsset from '~/assets/homepage/lifebouy-inverted.svg'
import lifebouyInvertedMdAsset from '~/assets/homepage/lifebouy-inverted-md.svg'

import findProduct from '~/assets/homepage/slider/find-product.svg'
import shopCheckout from '~//assets/homepage/slider/exact-cashback-earnings.svg'
import chaChingCashback from '~/assets/homepage/slider/cha-ching-get-your-cashback.svg'

const data: { title: string; description: string; image: string }[] = [
  {
    title: 'Find a Product',
    description: 'Copy-paste your product link.',
    image: findProduct,
  },
  {
    title: 'Shop and Checkout',
    description: 'Preview of the cashback you\'ll earn.',
    image: shopCheckout,
  },
  {
    title: 'Cha-Ching! Get your Cashback',
    description: 'Stack your earnings until you\'re happy to withdraw!',
    image: chaChingCashback,
  },
];
</script>

<template>
  <Wrapper>
    <WrapperSwiper
      :data="data"
    >
      <template #title>
        <div
          class="hidden lg:flex flex-col lg:text-5xl xl:text-6xl font-bold"
        >
          <span
            class="text-black"
          >
            Fast-easy 
          </span>

          <span
            class="text-black"
          >
            Way to Earn
          </span>

          <span
            class="text-marine-700"
          >
            Cashback!
          </span>
        </div>

        <div
          class="flex lg:hidden flex-col text-2xl sm:text-3xl md:text-4xl text-center font-bold"
        >
          <span
            class="text-black"
          >
            Fast-easy
          </span>

          <div>
            <span class="text-black">
              to Earn
            </span>
            <span class="text-marine-700">
              Cashback!
            </span>
          </div>
        </div>
      </template>     
    </WrapperSwiper>

    <div
      class="absolute
        top-[29%] sm:top-[25%] md:top-[20%] lg:-top-[1.25rem] xl:-top-[1.25rem]  
        -left-14 sm:-left-10 md:-left-6 lg:left-20 xl:left-52"
    >
      <img
        :src="cashAsset"
        alt="cash"
        class="w-[8.241rem] h-[6.705rem] sm:w-[9.5rem] sm:h-[8rem] md:w-[11rem] md:h-[9.5rem] lg:w-[12.5rem] lg:h-[10.5rem] xl:w-[13.8925rem] xl:h-[11.30375rem]"
      />
    </div>

    <div
      class="hidden lg:block absolute lg:bottom-0 xl:bottom-2 lg:right-6 xl:right-[10rem]"
    >
      <img
        :src="lifebouyInvertedAsset"
        alt="lifebouy-inverted"
        class="w-[5.5625rem] h-[7.201rem] sm:w-[7rem] sm:h-[9rem] md:w-[9.5rem] md:h-[12rem] lg:w-[12rem] lg:h-[15rem] xl:w-[14.085rem] xl:h-[18.235rem]"
      />
    </div>

    <div
      class="block lg:hidden absolute -bottom-[3.5rem] sm:-bottom-[2.5rem] md:-bottom-[1.5rem] -right-6 sm:-right-4 md:right-2"
    >
      <img
        :src="lifebouyInvertedMdAsset"
        alt="lifebouy-inverted"
        class="w-[5.5625rem] h-[7.201rem] sm:w-[7rem] sm:h-[9rem] md:w-[9.5rem] md:h-[12rem] lg:w-[12rem] lg:h-[15rem] xl:w-[14.085rem] xl:h-[18.235rem]"
      />
    </div>
  </Wrapper>
</template>
