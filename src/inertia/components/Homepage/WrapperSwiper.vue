<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import SwiperCore from 'swiper';
import { Autoplay } from 'swiper/modules';
import 'swiper/css/bundle'
import 'swiper/css/autoplay';

interface Data {
  title: string;
  description: string;
  image: string;
}

defineProps({
  data: {
    type: Array as () => Data[],
    required: true,
  },
});

SwiperCore.use([Autoplay]);
</script>

<template>
  <swiper
    :spaceBetween="0"
    :slidesPerView="1"
    :loop="true"
    :autoplay="{ delay: 5000, disableOnInteraction: false }"
    class="w-full xl:w-[75rem]"
  >
    <swiper-slide
      v-for="item in data"
      :key="item.title"
      class="!w-full"
    >
      <div
        class="flex flex-col lg:flex-row items-center justify-center gap-[0.546rem] sm:gap-2 md:gap-4 lg:gap-6 xl:gap-11"
      >
        <slot name="title" />

        <div
          class="flex items-center justify-center"
        >
          <img
            :src="item.image"
            :alt="item.title"
            class="min-w-[13.064rem] h-[21.062rem] 
              sm:min-w-[16rem] sm:h-[25rem] 
              md:min-w-[19rem] md:h-[29rem] 
              lg:min-w-[22rem] lg:h-[33rem] 
              xl:min-w-[25rem] xl:h-[36.375rem]"
          />
        </div>

        <div
          class="grow flex flex-col items-center lg:items-start 
                justify-center text-center lg:text-left 
                text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 
                w-auto"
        >
          <span class="font-bold text-black">{{ item.title }}</span>
          <span class="text-black">{{ item.description }}</span>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
