<script setup lang="ts">
import Wrapper from '~/components/Homepage/Wrapper.vue'

import qrDownloadBagAsset from '~/assets/homepage/bag.svg'
import qrDownloadQrCodeAsset from '~/assets/download/qrcode.svg'
import logoAsset from '~/assets/homepage/logo.svg'
import previewAsset from '~/assets/download/preview.svg'

import appStore from '~/assets/download/app-store.svg'
import playStore from '~/assets/download/playstore.svg'
</script>

<template>
  <Wrapper>

    <div
      class="relative flex flex-col-reverse lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-11 w-full px-4 sm:px-8 lg:px-0 mt-8 lg:mt-16"
    >
      <div
        class="flex flex-col items-center lg:items-start justify-center gap-8 lg:gap-11 w-full max-w-[33.125rem] z-20"
      >
        <div
          class="flex flex-col text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-center lg:text-left font-bold"
        >
          <span
            class="text-black"
          >
            Shop smarter
          </span>

          <div>
            <span
              class="text-black"
            >
              with
            </span>

            <span
              class="text-marine-700"
            >
            Cashiu!
            </span>
          </div>
        </div>

        <div
          class="relative flex flex-col lg:flex-row items-center bg-white rounded-lg lg:rounded-2xl w-full max-w-full p-4 sm:p-5 gap-4 lg:gap-5 shadow-md mb-8"
        >
          <!-- Mobile: QR above, Desktop: QR right -->
          <div class="flex flex-col lg:flex-row items-center w-full gap-4 lg:gap-0">
            <!-- Desktop: left label/buttons, right QR -->
            <div class="hidden lg:flex flex-col items-start w-full">
              <span class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-black mb-2">
                Download or scan
              </span>
              <div class="flex flex-col gap-2 w-full justify-center">
                <a
                  href="https://apps.apple.com/my/app/cha-ching-shop-get-cashback/id6745090543"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download on the App Store"
                >
                  <img
                    :src="appStore"
                    alt="app store"
                    class="w-[10rem] xl:w-[11.11rem]"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.cmv.chaching"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get it on Google Play"
                >
                  <img
                    :src="playStore"
                    alt="play store"
                    class="w-[10rem] xl:w-[11.11rem]"
                  />
                </a>
              </div>
            </div>
            <div class="hidden lg:flex flex-col items-center lg:ml-8 flex-shrink-0">
              <img
                :src="qrDownloadQrCodeAsset"
                alt="QR code"
                class="h-44 w-44 xl:h-52 xl:w-52 mx-auto"
              />
            </div>
            <!-- Mobile: label, QR, buttons -->
            <div class="flex flex-col items-center w-full lg:hidden">
              <span class="text-xs sm:text-sm md:text-base font-medium text-black mb-2">
                Download or scan
              </span>
              <img
                :src="qrDownloadQrCodeAsset"
                alt="QR code"
                class="h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 mx-auto mb-2"
              />
              <div class="flex flex-row gap-2 sm:gap-4 w-full justify-center mt-2">
                <a
                  href="https://apps.apple.com/my/app/cha-ching-shop-get-cashback/id6745090543"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download on the App Store"
                >
                  <img
                    :src="appStore"
                    alt="app store"
                    class="w-[6.38rem] sm:w-[7.5rem] md:w-[8.75rem]"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.cmv.chaching"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get it on Google Play"
                >
                  <img
                    :src="playStore"
                    alt="play store"
                    class="w-[6.38rem] sm:w-[7.5rem] md:w-[8.75rem]"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="relative flex items-end justify-center w-full max-w-[27.75rem] sm:max-w-[32rem] md:max-w-[40rem] lg:max-w-[48.875rem] xl:max-w-[56rem] z-10 mb-4 lg:mb-0"
        style="pointer-events: none;"
      >
        <img
          :src="previewAsset"
          alt="phone"
          class="w-full h-auto max-h-[23.535rem] sm:max-h-[32rem] md:max-h-[40rem] lg:max-h-[48.875rem] xl:max-h-[56rem] object-contain drop-shadow-lg"
          style="pointer-events: none; user-select: none; margin-top: -2rem;"
        />
      </div>
    </div>

    <div
      class="absolute -z-10 bottom-0 left-0 w-full flex justify-between pointer-events-none"
    >
      <img
        :src="qrDownloadBagAsset"
        alt="bag"
        class="w-[4rem] h-[5rem] sm:w-[7rem] sm:h-[9rem] md:w-[10rem] md:h-[12rem] lg:w-[13rem] lg:h-[15rem] xl:w-[16rem] xl:h-[19rem] ml-2 sm:ml-8 md:ml-16 lg:ml-32 xl:ml-40 opacity-80"
      />
      <img
        :src="logoAsset"
        alt="logo"
        class="w-[7rem] h-[12rem] sm:w-[10rem] sm:h-[18rem] md:w-[14rem] md:h-[24rem] lg:w-[18rem] lg:h-[32rem] xl:w-[22rem] xl:h-[38rem] mr-2 sm:mr-8 md:mr-16 lg:mr-32 xl:mr-40 opacity-80"
      />
    </div>
  </Wrapper>
</template>
