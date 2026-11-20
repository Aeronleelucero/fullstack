;(() => {
  let theme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
  try {
    const saved = localStorage.getItem('nexora.theme.v1')
    if (['dark', 'light'].includes(saved)) theme = saved
  } catch {}
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#111116' : '#f6f6f9')
})()
