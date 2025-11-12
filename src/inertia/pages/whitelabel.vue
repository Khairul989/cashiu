<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { onMounted, ref } from 'vue'

import Header from '~/components/Homepage/Header.vue'
import Footer from '~/components/Homepage/Footer.vue'

const expandedSection = ref<string | null>(null)

const toggleSection = (section: string) => {
  expandedSection.value = expandedSection.value === section ? null : section
}

onMounted(() => {
  document.body.classList.add('overflow-x-hidden', "overflow-y-scroll", "no-scrollbar")
  document.documentElement.classList.add("overflow-y-scroll", "no-scrollbar")
})
</script>

<template>
  <Head title="Mobile App Whitelabel Solution" />

  <main class="relative bg-primary-50 min-h-screen">
    <Header />

    <div class="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <!-- Hero Section -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-bold text-primary-800 mb-4">
          Mobile App Whitelabel Solution
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Launch your own branded cashback mobile app on iOS and Android. Proven architecture with ~60% whitelabel readiness.
        </p>
      </div>

      <!-- Current State of Configurability -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Current State of Configurability</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-3">✅ What's Already Configurable</h3>
              <ul class="text-gray-600 space-y-2">
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>Environment files:</strong> Separate configs per environment (dev/staging/prod)</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>Build flavors:</strong> Android (dev/prod), iOS (schemes)</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>API endpoints:</strong> Configurable base URLs and API keys</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>External services:</strong> Firebase, Firebase Auth, Sentry, Posthog</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-3">❌ Hard-coded Elements</h3>
              <ul class="text-gray-600 space-y-2">
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">✗</span>
                  <span><strong>App name, bundle ID, version</strong> - Build-time configuration</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">✗</span>
                  <span><strong>App icons and splash screens</strong> - Static assets</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">✗</span>
                  <span><strong>Colors and themes</strong> - Hard-coded hex values</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">✗</span>
                  <span><strong>Strings and text content</strong> - Not localized</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Areas Needing Whitelabel Support -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Key Areas Needing Whitelabel Support</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold text-primary-700 mb-3">🎨 Branding Elements</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• Dynamic app icons and splash screens</li>
              <li>• Configurable color schemes and themes</li>
              <li>• Asset isolation per client</li>
              <li>• Custom fonts and typography</li>
              <li>• Brand-specific imagery and logos</li>
            </ul>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold text-primary-700 mb-3">⚙️ Configuration & APIs</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• Client-specific Firebase projects</li>
              <li>• Separate API endpoints and keys</li>
              <li>• Custom deep link domains</li>
              <li>• Google Play/App Store accounts</li>
              <li>• Client-specific build configs</li>
            </ul>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold text-primary-700 mb-3">🏗️ Build Configuration</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• Scalable flavor system (beyond 2-3 clients)</li>
              <li>• Automated multi-client builds</li>
              <li>• Shorebird OTA setup (client-managed)</li>
              <li>• Code signing per client</li>
              <li>• Deployment automation</li>
            </ul>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold text-primary-700 mb-3">🔧 Business Logic</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• Feature toggles per client</li>
              <li>• Custom business rules</li>
              <li>• Client-specific data models</li>
              <li>• Configurable user flows</li>
              <li>• Third-party integrations</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Existing Patterns Supporting Whitelabeling -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Existing Patterns Supporting Whitelabeling</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-4">✅ Strong Foundation</h3>
              <div class="space-y-3">
                <div class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <div>
                    <strong>Clean Architecture:</strong>
                    <p class="text-gray-600 text-sm">Separation of concerns with dependency injection facilitates modular development</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <div>
                    <strong>Environment-based Config:</strong>
                    <p class="text-gray-600 text-sm">Most settings externalized through .env files</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <div>
                    <strong>Build Flavors/Schemes:</strong>
                    <p class="text-gray-600 text-sm">Multi-flavor Android builds and iOS schemes</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-4">🔄 Minor Architectural Gaps</h3>
              <div class="space-y-3">
                <div class="flex items-start">
                  <span class="text-yellow-500 mr-2">⚠</span>
                  <div>
                    <strong>Static Theming:</strong>
                    <p class="text-gray-600 text-sm">Colors/themes are hard-coded, not dynamically loaded</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-yellow-500 mr-2">⚠</span>
                  <div>
                    <strong>Asset Management:</strong>
                    <p class="text-gray-600 text-sm">No client-specific asset isolation</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-yellow-500 mr-2">⚠</span>
                  <div>
                    <strong>Flavor Scalability:</strong>
                    <p class="text-gray-600 text-sm">Current approach doesn't scale beyond 2-3 clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Constraints & Challenges -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Technical Constraints & Challenges</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <h3 class="text-xl font-semibold text-red-700 mb-3">🚨 Critical Challenges</h3>
            <div class="space-y-3">
              <div>
                <strong>Hard-coded Branding:</strong>
                <p class="text-gray-600">App name, bundle ID, icons, colors, and images are static assets requiring compile-time changes</p>
              </div>
              <div>
                <strong>Flavor Limitations:</strong>
                <p class="text-gray-600">Manual flavor management doesn't scale beyond 2-3 clients, each requiring separate build configurations</p>
              </div>
              <div>
                <strong>Firebase Multi-tenancy:</strong>
                <p class="text-gray-600">Firebase project sharing across clients requires careful authentication and service account configuration</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <h3 class="text-xl font-semibold text-yellow-700 mb-3">⚠️ Additional Considerations</h3>
            <div class="space-y-3">
              <div>
                <strong>Deep Link Conflicts:</strong>
                <p class="text-gray-600">Multiple apps with same deep link schemes can cause conflicts - requires unique scheme per client</p>
              </div>
              <div>
                <strong>Asset Storage Strategy:</strong>
                <p class="text-gray-600">Bundle all assets vs. runtime loading impacts app size and dynamic theming capabilities</p>
              </div>
              <div>
                <strong>Shorebird OTA Updates:</strong>
                <p class="text-gray-600">Third-party service requiring individual client setup and accounts</p>
              </div>
              <div>
                <strong>Code Signing & Deployment:</strong>
                <p class="text-gray-600">Unique App Store/Google Play accounts per client needed; manual code signing complexity</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Whitelabel Architecture Recommendations -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Whitelabel Architecture Recommendations</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-semibold text-primary-700 mb-2">Phase 1: Dynamic Theming Foundation</h3>
                <p class="text-gray-600 mb-3">Implement configurable theming system with JSON-based theme loading</p>
                <div class="bg-gray-50 rounded p-4">
                  <p class="text-sm font-semibold mb-2">Key Components:</p>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li>• <code>ThemeManager</code> service with dynamic loading</li>
                    <li>• <code>ThemeConfig</code> data class with color/scheme definitions</li>
                    <li>• <code>ThemedWidget</code> wrapper for dynamic styling</li>
                    <li>• <code>assets/themes/[client]/</code> directory structure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-semibold text-primary-700 mb-2">Phase 2: Client Configuration System</h3>
                <p class="text-gray-600 mb-3">Build comprehensive client configuration management</p>
                <div class="bg-gray-50 rounded p-4">
                  <p class="text-sm font-semibold mb-2">Key Components:</p>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li>• <code>ClientConfig</code> data class for all client settings</li>
                    <li>• <code>ConfigService</code> with remote/local config loading</li>
                    <li>• <code>EnvironmentService</code> for API endpoint management</li>
                    <li>• <code>build.gradle</code> and <code>Xcode schemes</code> configuration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-semibold text-primary-700 mb-2">Phase 3: Build & Deployment Automation</h3>
                <p class="text-gray-600 mb-3">Automate multi-client build pipeline with CI/CD</p>
                <div class="bg-gray-50 rounded p-4">
                  <p class="text-sm font-semibold mb-2">Key Components:</p>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li>• <code>client_configs.yaml</code> centralized configuration</li>
                    <li>• <code>scripts/build_client.sh</code> automated build scripts</li>
                    <li>• GitHub Actions for multi-client builds</li>
                    <li>• Setup guide for Shorebird OTA (client-managed)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Deep Link Configuration -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Deep Link Configuration</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <p class="text-gray-700 mb-4">For whitelabel apps to work properly with deep linking, each client needs their own domain configuration files hosted on their web servers.</p>

          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-3">🍎 iOS (apple-app-site-association)</h3>
              <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{
  "applinks": {
    "details": [
      {
        "appIDs": ["[TEAM_ID].[BUNDLE_ID]"],
        "components": [
          {
            "/": "/share/*",
            "comment": "Matches share URL path"
          },
          {
            "/": "/products/*",
            "comment": "Matches product URL path"
          }
        ]
      }
    ]
  }
}</pre>
              </div>
            </div>

            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-3">🤖 Android (assetlinks.json)</h3>
              <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "[PACKAGE_NAME]",
      "sha256_cert_fingerprints":
      ["[CERTIFICATE_FINGERPRINT]"]
    }
  }
]</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Whitelabel Readiness Score -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Whitelabel Readiness Score</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <div class="text-6xl font-bold text-primary-600 mb-2">~60%</div>
            <p class="text-gray-600">Current Readiness Assessment</p>
          </div>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700">Architecture & Patterns</span>
                <span class="text-sm text-gray-600">85%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700">Configuration Management</span>
                <span class="text-sm text-gray-600">70%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full" style="width: 70%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700">Branding Flexibility</span>
                <span class="text-sm text-gray-600">30%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-yellow-500 h-2 rounded-full" style="width: 30%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700">Build & Deployment</span>
                <span class="text-sm text-gray-600">45%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-orange-500 h-2 rounded-full" style="width: 45%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700">Asset Management</span>
                <span class="text-sm text-gray-600">20%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full" style="width: 20%"></div>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>Assessment:</strong> Strong foundation with dependency injection and clean architecture, but major gaps in dynamic theming and asset isolation need addressing.
            </p>
          </div>
        </div>
      </section>

      <!-- Estimated Effort -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Estimated Effort & Timeline</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="space-y-6">
            <div class="border-l-4 border-blue-500 pl-6">
              <h3 class="text-xl font-semibold text-primary-700 mb-2">Phase 1: Dynamic Theming Foundation (3-4 weeks)</h3>
              <ul class="text-gray-600 space-y-1">
                <li>• Week 1: Refactor hardcoded colors to dynamic system</li>
                <li>• Week 2: Create ThemeManager service and configuration loading</li>
                <li>• Week 3: Implement dynamic asset loading for icons/images</li>
                <li>• Week 4: Add client-specific asset directory structure</li>
              </ul>
            </div>

            <div class="border-l-4 border-blue-500 pl-6">
              <h3 class="text-xl font-semibold text-primary-700 mb-2">Phase 2: Client Configuration System (2-3 weeks)</h3>
              <ul class="text-gray-600 space-y-1">
                <li>• Week 1: Design ClientConfig data structure</li>
                <li>• Week 2: Implement ConfigService for remote/local loading</li>
                <li>• Week 3: Add client-specific build configurations</li>
              </ul>
            </div>

            <div class="border-l-4 border-blue-500 pl-6">
              <h3 class="text-xl font-semibold text-primary-700 mb-2">Phase 3: Build & Deployment Automation (2-3 weeks)</h3>
              <ul class="text-gray-600 space-y-1">
                <li>• Week 1: Create client configuration files and build scripts</li>
                <li>• Week 2: Set up CI/CD pipeline for multi-client builds</li>
                <li>• Week 3: Setup Shorebird OTA integration (client account required)</li>
              </ul>
            </div>
          </div>

          <div class="mt-8 p-4 bg-primary-50 rounded-lg">
            <p class="text-lg font-semibold text-primary-800 mb-2">Total Estimated Time: 5-9 weeks</p>
            <p class="text-gray-600">Timeline assumes 1-2 developers working full-time on whitelabel implementation.</p>
          </div>
        </div>
      </section>

      <!-- Key Decision Points -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Key Decision Points</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold text-primary-700 mb-3">🤔 Strategic Considerations</h3>
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold text-gray-800 mb-2">Number of Clients</h4>
                <p class="text-gray-600 text-sm mb-2">Determines build automation investment vs. manual approach</p>
                <div class="flex space-x-2">
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">2-3 clients: Manual</span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">4+ clients: Automated</span>
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-gray-800 mb-2">Theme Customization Depth</h4>
                <p class="text-gray-600 text-sm mb-2">Scope of visual changes allowed per client</p>
                <div class="flex space-x-2">
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Basic: Colors only</span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Advanced: Full UI</span>
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-gray-800 mb-2">Asset Storage Strategy</h4>
                <p class="text-gray-600 text-sm mb-2">Bundle all assets vs. runtime loading</p>
                <div class="flex space-x-2">
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Bundle: Simpler</span>
                  <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Runtime: Flexible</span>
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-gray-800 mb-2">Firebase Multi-tenancy</h4>
                <p class="text-gray-600 text-sm mb-2">Shared vs. separate Firebase projects per client</p>
                <div class="flex space-x-2">
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Shared: Cost-effective</span>
                  <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Separate: Isolated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Summary and Priority Actions -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Summary and Priority Actions</h2>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-4">🎯 Top Priorities</h3>
              <ol class="space-y-3">
                <li class="flex items-start">
                  <span class="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">1</span>
                  <div>
                    <strong>Dynamic Theming Implementation</strong>
                    <p class="text-gray-600 text-sm">Replace hard-coded colors with configurable theming system</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">2</span>
                  <div>
                    <strong>Asset Isolation Strategy</strong>
                    <p class="text-gray-600 text-sm">Implement client-specific asset directory structure</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">3</span>
                  <div>
                    <strong>Build Automation</strong>
                    <p class="text-gray-600 text-sm">Create scripts for multi-client builds and deployment</p>
                  </div>
                </li>
              </ol>
            </div>

            <div>
              <h3 class="text-xl font-semibold text-primary-700 mb-4">📋 Implementation Checklist</h3>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Create ThemeManager service</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Refactor hardcoded colors to dynamic theming</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Design ClientConfig data structure</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Implement ConfigService for client configs</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Create client-specific asset directories</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Set up automated build scripts</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Configure deep linking for multiple domains</span>
                </li>
                <li class="flex items-center">
                  <input type="checkbox" class="mr-2" disabled>
                  <span class="text-gray-600">Setup Shorebird OTA integration (client manages account)</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 class="font-semibold text-green-800 mb-2">Expected Timeline: 5-9 weeks</h4>
            <p class="text-green-700">
              With focused development, the app can achieve full whitelabel capability in approximately 2 months, enabling rapid deployment of branded cashback apps for multiple clients.
            </p>
          </div>
        </div>
      </section>

      <!-- Getting Started -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Ready to Launch Your Branded Mobile App?</h2>
        <div class="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-8">
          <p class="text-lg mb-6">
            Leverage our proven mobile app architecture to launch your own branded cashback application on iOS and Android. With a 60% whitelabel readiness foundation, we can have your custom app ready in 5-9 weeks.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <button class="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
              Schedule Technical Consultation
            </button>
            <button class="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-colors">
              Request Whitelabel Assessment
            </button>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-primary-800 mb-6">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-primary-700 mb-3 cursor-pointer" @click="toggleSection('faq1')">
              How long does mobile app whitelabeling take?
            </h3>
            <p v-show="expandedSection === 'faq1'" class="text-gray-600">
              The complete whitelabel implementation takes 5-9 weeks, depending on customization requirements. This includes dynamic theming, client configuration systems, and build automation.
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-primary-700 mb-3 cursor-pointer" @click="toggleSection('faq2')">
              What platforms are supported?
            </h3>
            <p v-show="expandedSection === 'faq2'" class="text-gray-600">
              Our whitelabel solution supports both iOS and Android through Flutter framework. This includes deployment to Apple App Store and Google Play Store under your own developer accounts.
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-primary-700 mb-3 cursor-pointer" @click="toggleSection('faq3')">
              Can we customize features per client?
            </h3>
            <p v-show="expandedSection === 'faq3'" class="text-gray-600">
              Yes, our architecture supports feature toggles and business logic customization per client. This allows different branding, workflows, and integrations while maintaining core functionality.
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-primary-700 mb-3 cursor-pointer" @click="toggleSection('faq4')">
              How are app updates managed for multiple clients?
            </h3>
            <p v-show="expandedSection === 'faq4'" class="text-gray-600">
              For OTA (Over-the-Air) updates, clients need to set up their own Shorebird accounts. We provide integration guides and setup assistance, but each client manages their own Shorebird subscription and deployment under their app store accounts.
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-primary-700 mb-3 cursor-pointer" @click="toggleSection('faq5')">
              What infrastructure is required?
            </h3>
            <p v-show="expandedSection === 'faq5'" class="text-gray-600">
              Each client needs their own Apple Developer and Google Play Console accounts. We provide Firebase project setup guidance and can manage backend API services through our existing infrastructure.
            </p>
          </div>
        </div>
      </section>
    </div>

    <div class="h-16 md:h-24"></div>

    <Footer />
  </main>
</template>