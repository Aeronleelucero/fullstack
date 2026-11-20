import { ref } from 'vue'

const theme = ref(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.value === 'dark' ? '#0B0714' : '#FAF8FF')
    try { localStorage.setItem('portfolio-theme', theme.value) } catch { /* Theme remains usable without storage. */ }
  }
  return { theme, toggleTheme }
}
