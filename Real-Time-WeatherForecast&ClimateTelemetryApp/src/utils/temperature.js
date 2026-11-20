export function convertTemperature(celsius, unit = 'c') {
  if (!Number.isFinite(celsius)) return null
  return unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
}
export function formatTemperature(celsius, unit = 'c') {
  const value = convertTemperature(celsius, unit)
  if (value === null) return '—'
  return String(Object.is(Math.round(value), -0) ? 0 : Math.round(value))
}
