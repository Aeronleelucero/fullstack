import { ref } from 'vue'
const theme = ref(
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
)
export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.value === 'light' ? '#F8F7FC' : '#0B0714')
    try {
      localStorage.setItem('productivity.theme.v1', theme.value)
    } catch {
      /* Session theme still works. */
    }
  }
  return { theme, toggleTheme }
}
