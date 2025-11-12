import { computed, ref, watch } from 'vue'

// Shared module-scoped state so all components use the same source of truth
const currentTheme = ref<string>('light')

// Get initial theme from localStorage or system preference
const getInitialTheme = (): string => {
  if (typeof window === 'undefined') return 'light'
  const savedTheme = window.localStorage.getItem('theme')
  if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    return savedTheme
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

// Initialize immediately at module load
currentTheme.value = getInitialTheme()

// Apply theme class to document and keep it in sync
if (typeof document !== 'undefined') {
  watch(
    currentTheme,
    (newTheme) => {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    { immediate: true }
  )

  // Listen for system theme changes (only if user hasn't set a preference)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!window.localStorage.getItem('theme')) {
        currentTheme.value = e.matches ? 'dark' : 'light'
      }
    }
    try {
      mediaQuery.addEventListener('change', handleChange)
    } catch (_) {
      // Safari <14 fallback
      // @ts-ignore
      mediaQuery.addListener(handleChange)
    }
  }
}

const isDark = computed(() => currentTheme.value === 'dark')

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  currentTheme.value = newTheme
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('theme', newTheme)
  }
}

const setTheme = (theme: 'light' | 'dark') => {
  if (['light', 'dark'].includes(theme)) {
    currentTheme.value = theme
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme)
    }
  }
}

export function useDarkMode() {
  return {
    currentTheme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
