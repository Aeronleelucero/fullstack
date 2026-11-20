// Run before the first paint. Storage may be disabled in private browsing.
try {
  const saved = localStorage.getItem('portfolio-theme')
  document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}
document.querySelector('meta[name="theme-color"]')?.setAttribute(
  'content', document.documentElement.dataset.theme === 'light' ? '#FAF8FF' : '#0B0714',
)
