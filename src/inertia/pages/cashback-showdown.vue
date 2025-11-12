<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { onMounted } from 'vue'

import Header from '~/components/Homepage/Header.vue'
import Footer from '~/components/Homepage/Footer.vue'

onMounted(() => {
  document.body.classList.add('overflow-x-hidden', 'overflow-y-scroll', 'no-scrollbar')
  document.documentElement.classList.add('overflow-y-scroll', 'no-scrollbar')
})
</script>

<template>
  <Head
    title="Cashback Showdown July 2025 | Win RM100 with Cha-Ching"
    description="Join our July Cashback Showdown! Top 10 users with highest cashback earned will win RM100 each. Download Cha-Ching now and start earning cashback on Shopee purchases!"
  />

  <main class="relative bg-gradient-to-br from-marine-50 via-white to-marine-100 min-h-screen">
    <Header />

    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Hero Image Section -->
      <section class="mb-12">
        <div class="relative overflow-hidden rounded-2xl shadow-2xl">
          <img
            src="https://img.appchaching.com/guides/cashback-showdown.jpg"
            alt="Cashback Showdown Guide"
            class="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0"></div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
        <!-- Decorative elements -->
        <div
          class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-marine-200 to-marine-300 rounded-full -translate-y-16 translate-x-16 opacity-50"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-200 to-red-300 rounded-full translate-y-12 -translate-x-12 opacity-50"
        ></div>

        <div class="relative z-10">
          <h1 class="text-4xl md:text-5xl font-bold mb-8 text-center text-marine-700">
            July Cashback Showdown 2025
          </h1>

          <!-- Prize Banner -->
          <div
            class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 mb-10 text-center text-black shadow-2xl"
          >
            <div class="text-5xl mb-4">🏆</div>
            <h2 class="text-2xl md:text-3xl font-bold mb-2">Win RM100!</h2>
            <p class="text-lg font-semibold">Top 10 highest cashback earners in July 2025</p>
            <div class="mt-4 text-sm font-medium">
              📅 Contest Period: July 1st - July 31st, 2025
            </div>
          </div>

          <div class="text-center mb-10">
            <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ready to win big? Join our exclusive
              <span class="font-semibold text-marine-700">July Cashback Showdown</span> and compete
              with fellow shoppers to earn the highest cashback. The top 10 users will each receive
              <span class="font-bold text-green-600">RM100</span>!
            </p>
          </div>
          <!-- How to Participate Section -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">📲</div>
              <h2 class="font-bold text-xl mb-3 text-green-800">1. Download Cha-Ching</h2>
              <p class="text-gray-700">
                Download the Cha-Ching app from Play Store or App Store and create your account to
                get started.
              </p>
            </div>

            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">🛒</div>
              <h2 class="font-bold text-xl mb-3 text-blue-800">2. Shop on Shopee</h2>
              <p class="text-gray-700">
                Browse verified sellers and make purchases through the Cha-Ching app to earn
                cashback on every transaction.
              </p>
            </div>

            <div
              class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">🤑</div>
              <h2 class="font-bold text-xl mb-3 text-purple-800">3. Earn & Win</h2>
              <p class="text-gray-700">
                Accumulate cashback throughout July 2025. The top 10 earners will each win RM100 bonus reward!
              </p>
            </div>

            <div
              class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">⚡</div>
              <h2 class="font-bold text-xl mb-3 text-orange-800">Tracking Purchase</h2>
              <p class="text-gray-700">
                See your cashback credited immediately after purchase confirmation.
              </p>
            </div>

            <div
              class="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">🔎</div>
              <h2 class="font-bold text-xl mb-3 text-red-800">Greater Visibility</h2>
              <p class="text-gray-700">
                Get insights into your transactions and track your contest progress with ease.
              </p>
            </div>

            <div
              class="bg-gradient-to-br from-marine-50 to-marine-100 p-6 rounded-2xl border border-marine-200 hover:shadow-lg transition-all duration-300"
            >
              <div class="text-3xl mb-4">🏪</div>
              <h2 class="font-bold text-xl mb-3 text-marine-800">Trusted Sellers</h2>
              <p class="text-gray-700">
                Shop confidently from our network of reviewed sellers. Eligible purchases will
                contribute to your contest progress.
              </p>
            </div>
          </div>

          <!-- Contest Timeline -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Contest Timeline</h2>
            <div class="bg-gradient-to-r from-marine-100 to-marine-200 rounded-2xl p-8">
              <div class="grid md:grid-cols-3 gap-6 text-center">
                <div class="bg-white rounded-xl p-6 shadow-lg">
                  <div class="text-3xl mb-3">🚀</div>
                  <h3 class="font-bold text-lg mb-2 text-marine-700">Contest Starts</h3>
                  <p class="text-gray-600">July 1st, 2025</p>
                  <p class="text-sm text-gray-500 mt-2">Download app & start earning!</p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-lg">
                  <div class="text-3xl mb-3">💸</div>
                  <h3 class="font-bold text-lg mb-2 text-marine-700">Earning Period</h3>
                  <p class="text-gray-600">Throughout July 2025</p>
                  <p class="text-sm text-gray-500 mt-2">Shop & accumulate cashback</p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-lg">
                  <div class="text-3xl mb-3">🏆</div>
                  <h3 class="font-bold text-lg mb-2 text-marine-700">Winners Announced</h3>
                  <p class="text-gray-600">August 10th, 2025</p>
                  <p class="text-sm text-gray-500 mt-2">Top 10 winners get RM100 each!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="bg-gray-50 rounded-3xl p-8 md:p-12 mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Terms & Conditions</h2>

            <div class="bg-gray-100 rounded-2xl p-6">
              <div class="space-y-6 text-gray-700">
                <div>
                  <h3 class="font-bold text-lg mb-3 text-gray-800">Competition Overview</h3>
                  <p class="mb-3">
                    This competition runs throughout July 2025. We're rewarding 10 users who earn
                    the highest total accumulated cashback from eligible transactions during this
                    month. Each of these 10 winners will receive an additional RM100 cashback.
                    Winners will be announced in August 2025.
                  </p>
                </div>

                <div>
                  <h3 class="font-bold text-lg mb-3 text-gray-800">Key Conditions</h3>
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Eligibility:</h4>
                      <p>
                        To qualify, you must have an active and valid account with Cha-Ching!
                        throughout the competition period (July 1-31, 2025) and when prizes are
                        disbursed.
                      </p>
                    </div>

                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">
                        Calculating "Highest Cashback":
                      </h4>
                      <p>
                        Your total accumulated cashback will be calculated based on all eligible
                        cashback successfully earned from transactions made between July 1, 2025
                        (00:00 AM +08) and July 31, 2025 (23:59 PM +08).
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="font-bold text-lg mb-3 text-gray-800">
                    Winner Notification and Prize Disbursement
                  </h3>
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Winner Notification:</h4>
                      <p>
                        Winners will be notified by August 10, 2025, via their registered email
                        address & In-app notification.
                      </p>
                    </div>

                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Prize Disbursement:</h4>
                      <p>
                        The additional RM100 cashback will be credited directly to your Cha-Ching!
                        account by August 31, 2025. This bonus cashback is subject to the same terms
                        as regular cashback.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="font-bold text-lg mb-3 text-gray-800">
                    General Conditions and Disclaimers
                  </h3>
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Disqualification:</h4>
                      <p>
                        We reserve the right to disqualify any participant engaging in fraudulent
                        activity, tampering with the competition, or violating these T&Cs. All
                        decisions made by Cha-Ching! are final.
                      </p>
                    </div>

                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Modifications:</h4>
                      <p>
                        Cha-Ching! can modify, suspend, or terminate the competition at any time due
                        to unforeseen circumstances, without prior notice. Any changes will be
                        communicated on our official platform.
                      </p>
                    </div>

                    <div>
                      <h4 class="font-semibold text-gray-800 mb-2">Privacy:</h4>
                      <p>
                        All personal data collected for this competition will be processed according
                        to Cha-Ching's
                        <a
                          href="https://appchaching.com/privacy-policy"
                          class="text-marine-600 font-medium underline"
                          >Privacy Policy</a
                        >.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <h4 class="text-lg font-bold text-yellow-800 mb-2">Important Notice</h4>
              <p class="text-gray-700">
                Cha-Ching reserves the right to modify contest terms, verify eligibility, and
                disqualify users found violating contest rules. All decisions are final. For
                questions, contact us at
                <a
                  href="mailto:contact@appchaching.com"
                  class="text-marine-600 font-medium underline"
                  >contact@appchaching.com</a
                >.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="h-16 md:h-24"></div>

    <Footer />
  </main>
</template>
