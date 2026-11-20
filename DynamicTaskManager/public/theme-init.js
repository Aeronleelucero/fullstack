try {
  document.documentElement.dataset.theme =
    localStorage.getItem('productivity.theme.v1') === 'light' ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}
document
  .querySelector('meta[name="theme-color"]')
  ?.setAttribute(
    'content',
    document.documentElement.dataset.theme === 'light' ? '#F8F7FC' : '#0B0714',
  )
