;(() => {
  let theme = 'dark'
  try {
    const stored = JSON.parse(localStorage.getItem('atmos.preferences.v1'))
    if (stored?.version === 1 && ['dark', 'light'].includes(stored.theme))
      theme = stored.theme
  } catch {}
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#eef2fb' : '#0b1024')
})()
