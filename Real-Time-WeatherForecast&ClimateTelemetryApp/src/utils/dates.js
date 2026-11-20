export function validTimezone(value) {
  if (typeof value !== 'string') return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}
export function localDateKey(instant, timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}
export function formatLocal(instant, timezone, options = {}) {
  return new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    ...options,
  }).format(instant)
}
export function dateFromApiDay(seconds, offset) {
  return new Date((seconds + offset) * 1000).toISOString().slice(0, 10)
}
export function formatForecastDate(date, options = { weekday: 'short' }) {
  // Forecast days are calendar dates, not instants in the browser's timezone.
  return new Intl.DateTimeFormat('en', { timeZone: 'UTC', ...options }).format(
    new Date(`${date}T12:00:00Z`),
  )
}
export function forecastDayLabel(date, timezone, now = Date.now()) {
  return date === localDateKey(now, timezone)
    ? 'Today'
    : formatForecastDate(date)
}
