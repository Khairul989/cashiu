<script setup lang="ts">
import Wrapper from '~/components/Homepage/Wrapper.vue'

import heroCartAsset from '~/assets/homepage/cart.svg'
import heroLifebuoyAsset from '~/assets/homepage/lifebuoy.svg'
import heroBagAsset from '~/assets/homepage/bag-hero.svg'
</script>

<template>
  <Wrapper>
    <div
      class="flex flex-col gap-3 sm:gap-5 md:gap-7 lg:gap-9 xl:gap-11"
    >
      <div
        class="flex flex-col text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold"
      >
        <span
          class="text-black"
        >
          Enjoy 100%
        </span>

        <div>
          <span
            class="text-marine-700"
          >
            Guaranteed Cashback.
          </span>
        </div>
      </div>

      <div
        class="flex flex-col text-center text-sm sm:text-base md:text-lg lg:text-2xl xl:text-4xl font-medium text-black"
      >
        <span>
          Everything you earn is yours to keep! 
        </span>

        <span>
          Save on every purchase you make from marketplace sites.
        </span>
      </div>
    </div>

    <div
      class="absolute 
      top-[17.75rem] sm:top-[16rem] md:top-[14rem] lg:top-[12rem] xl:top-[7.5rem]  
      -left-[3rem] sm:-left-[4rem] md:-left-[4.5rem] lg:-left-[5rem] xl:-left-[15rem]"
    >
      <img
        :src="heroCartAsset"
        alt="cart"
        class="w-[11.25rem] h-[9.5rem] sm:w-[14rem] sm:h-[12rem] md:w-[18rem] md:h-[15rem] lg:w-[24rem] lg:h-[20rem] xl:w-[29.230rem] xl:h-[24.465rem]"
      />
    </div>

    <div
      class="absolute top-28 -right-5 sm:-right-8 md:-right-12 lg:-right-20 xl:-right-28"
    >
      <img
        :src="heroLifebuoyAsset"
        alt="lifebuoy"
        class="w-[5.076rem] h-[4.726rem] sm:w-[6.5rem] sm:h-[6rem] md:w-[8rem] md:h-[7.5rem] lg:w-[10rem] lg:h-[9.5rem] xl:w-[12.393rem] xl:h-[11.5rem]"
      />
    </div>

    <div
      class="absolute -bottom-4 sm:-bottom-6 md:-bottom-8 lg:-bottom-[7rem] xl:-bottom-[10.5rem]  
      -right-8 sm:-right-10 md:-right-12 lg:-right-14 xl:-right-14"
    >
      <img
        :src="heroBagAsset"
        alt="bag"
        class="w-[11.3rem] h-[9.5rem] md:w-[20rem] md:h-[16rem] lg:w-[30.908rem] lg:h-[23.125rem]"
      />
    </div>
  </Wrapper>
</template>
