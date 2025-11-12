<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import FlashMessageHandler from '~/components/FlashMessageHandler.vue'
import Logo from '~/assets/logo.svg'
import Button from '~/components/Button.vue'

interface Props {
  useEmailPassword: boolean
  googleLogin: boolean
  appleLogin: boolean
}

withDefaults(defineProps<Props>(), {
  useEmailPassword: false,
  googleLogin: false,
  appleLogin: false,
})
</script>

<template>
  <Head title="Login" />

  <div class="min-h-screen bg-primary-50 flex flex-col">
    <div class="min-h-screen flex flex-col items-center justify-between space-y-4 py-20">
      <div class="flex items-center justify-center">
        <img :src="Logo" alt="Cashiu" class="py-16 content-center" />
      </div>
      <div class="flex flex-col justify-end">
        <div class="flex flex-col items-center justify-between gap-8">
          <div class="text-center">
            <p class="text-gray-900 font-bold text-md font-readex">
              Money doesn't grow on trees —<br />but here, it grows with
            </p>
            <p class="text-primary-700 text-3xl font-bold font-readex">every purchase</p>
          </div>

          <div class="w-screen max-w-sm space-y-4 px-6">
            <form class="space-y-4" action="/auth/login" method="POST" v-if="useEmailPassword">
              <div>
                <label
                  for="email"
                  class="block text-sm/6 font-medium text-gray-900 dark:text-gray-900"
                  >Email address</label
                >
                <input
                  type="email"
                  name="email"
                  id="email"
                  autocomplete="email"
                  required
                  class="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-1.5 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="block text-sm/6 font-medium text-gray-900 dark:text-gray-900"
                  >Password</label
                >
                <input
                  type="password"
                  name="password"
                  id="password"
                  autocomplete="current-password"
                  required
                  class="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-1.5 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>

              <Button type="submit" color="primary" class="w-full text-center"> Sign in </Button>
            </form>
            <a
              v-if="googleLogin"
              role="button"
              href="/auth/social/google"
              class="flex items-center justify-center w-full p-4 rounded-full bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
                height="20"
                width="20"
                class="mr-3"
              >
                <path
                  fill="#4285F4"
                  d="M21.36 12.222c0-.692-.062-1.356-.177-1.995H12v3.776h5.247a4.496 4.496 0 01-1.959 2.934v2.455h3.165c1.843-1.702 2.907-4.201 2.907-7.17z"
                ></path>
                <path
                  fill="#34A853"
                  d="M12 21.75c2.632 0 4.84-.869 6.453-2.358l-3.165-2.455c-.868.585-1.976.94-3.288.94-2.535 0-4.689-1.711-5.46-4.016H3.296v2.518C4.9 19.56 8.189 21.749 12 21.749z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M6.54 13.853A5.842 5.842 0 016.23 12c0-.647.115-1.267.31-1.852V7.63H3.296A9.63 9.63 0 002.25 12a9.63 9.63 0 001.046 4.37l2.526-1.968.718-.55z"
                ></path>
                <path
                  fill="#EA4335"
                  d="M12 6.132c1.436 0 2.712.497 3.732 1.454l2.792-2.792C16.83 3.216 14.632 2.25 12 2.25c-3.811 0-7.1 2.19-8.704 5.38l3.244 2.518C7.311 7.843 9.465 6.132 12 6.132z"
                ></path>
              </svg>
              <span class="font-medium text-sm text-gray-900">Continue with Google</span>
            </a>

            <a
              v-if="appleLogin"
              role="button"
              href="/auth/social/apple"
              class="flex items-center justify-center w-full p-4 rounded-full bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
                height="20"
                width="20"
                class="mr-3"
              >
                <path
                  fill="currentColor"
                  d="M20.3759 16.557C19.9189 17.572 19.6986 18.0257 19.1108 18.9216C18.2878 20.1734 17.127 21.7366 15.693 21.7465C14.4163 21.7581 14.0868 20.9136 12.3531 20.9285C10.621 20.9368 10.26 21.7631 8.98168 21.7498C7.54602 21.7366 6.44816 20.3291 5.62518 19.0789C3.32348 15.5733 3.08007 11.4634 4.50248 9.27763C5.50927 7.72771 7.10058 6.81696 8.59586 6.81696C10.1193 6.81696 11.0764 7.65319 12.3349 7.65319C13.5569 7.65319 14.3004 6.81531 16.0623 6.81531C17.3936 6.81531 18.8012 7.54059 19.8079 8.79245C16.516 10.5974 17.0509 15.2985 20.3759 16.557ZM14.7243 5.41608C15.3652 4.59309 15.852 3.43231 15.6748 2.25C14.6299 2.3212 13.4079 2.98853 12.6942 3.85291C12.0467 4.64112 11.5102 5.81018 11.7189 6.94116C12.8598 6.97759 14.0404 6.29701 14.7243 5.41608Z"
                ></path>
              </svg>
              <span class="font-medium text-sm text-gray-900">Continue with Apple</span>
            </a>
          </div>

          <div class="text-center font-medium">
            <p class="text-gray-900 text-sm mb-1">By connecting, you agree to the</p>
            <div class="space-x-1">
              <a
                href="https://articles.cashiu.app/terms-of-use/"
                target="_blank"
                class="text-primary-600 hover:underline text-sm"
                >Terms & Conditions</a
              >
              <span class="text-gray-900 text-sm">and</span>
              <a
                href="https://articles.cashiu.app/privacy-policy/"
                target="_blank"
                class="text-primary-600 hover:underline text-sm"
                >Privacy Policy.</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Global flash message handler -->
  <FlashMessageHandler />
</template>
