import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
export function useTheme() {
  const media =
    typeof matchMedia === 'function'
      ? matchMedia('(prefers-color-scheme: dark)')
      : null
  const theme = ref(media?.matches ? 'dark' : 'light'),
    warning = ref('')
  let explicit = false
  try {
    const saved = localStorage.getItem('nexora.theme.v1')
    if (['dark', 'light'].includes(saved)) {
      theme.value = saved
      explicit = true
    }
  } catch {}
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.value === 'dark' ? '#111116' : '#f6f6f9')
  })
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    explicit = true
    try {
      localStorage.setItem('nexora.theme.v1', theme.value)
      warning.value = ''
    } catch {
      warning.value =
        'Theme applies to this session; browser preference storage is unavailable.'
    }
  }
  function systemChanged(event) {
    if (!explicit) theme.value = event.matches ? 'dark' : 'light'
  }
  onMounted(() => media?.addEventListener('change', systemChanged))
  onUnmounted(() => media?.removeEventListener('change', systemChanged))
  return { theme, toggle, warning }
}
