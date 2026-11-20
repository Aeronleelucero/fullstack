import { computed, watchEffect } from 'vue'
export function useTheme(preferences) {
  const theme = computed(() => preferences.state.theme)
  watchEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = theme.value
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.value === 'light' ? '#eef2fb' : '#0b1024')
  })
  return {
    theme,
    toggleTheme: () =>
      preferences.setTheme(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
