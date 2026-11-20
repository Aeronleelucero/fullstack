import { cleanLocation } from '../utils/preferences.js'
import { dateFromApiDay, validTimezone } from '../utils/dates.js'
export class WeatherApiError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'WeatherApiError'
    this.code = code
    Object.assign(this, details)
  }
}
const invalid = () =>
  new WeatherApiError(
    'invalid-response',
    'The weather service returned incomplete data. Please try again shortly.',
  )
export async function requestJson(
  url,
  { signal, fetchImpl = globalThis.fetch, timeoutMs = 12000 } = {},
) {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (response.status === 429)
      throw new WeatherApiError(
        'rate-limit',
        'The weather service is receiving too many requests. Please wait a minute before trying again.',
      )
    if ([401, 403].includes(response.status))
      throw new WeatherApiError(
        'configuration',
        'The weather service refused access. The deployment or provider configuration needs attention.',
      )
    if (!response.ok)
      throw new WeatherApiError(
        'unavailable',
        'The weather service is temporarily unavailable. Please try again.',
      )
    try {
      return await response.json()
    } catch {
      throw invalid()
    }
  } catch (error) {
    if (signal?.aborted)
      throw new DOMException('Request cancelled', 'AbortError')
    if (timedOut)
      throw new WeatherApiError(
        'timeout',
        'The request took too long. Check your connection and try again.',
      )
    if (error instanceof WeatherApiError) throw error
    throw new WeatherApiError(
      'network',
      'We couldn’t connect to the weather service. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
export async function searchCities(query, options = {}) {
  const name = query.trim()
  if (Array.from(name).length < 2) return []
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({
    name: name.slice(0, 100),
    count: '8',
    language: 'en',
    format: 'json',
  })
  const json = await requestJson(url.toString(), options)
  if (
    !json ||
    typeof json !== 'object' ||
    Array.isArray(json) ||
    json.error ||
    (json.results !== undefined && !Array.isArray(json.results))
  )
    throw invalid()
  const results = [],
    seen = new Set()
  for (const city of json.results || []) {
    try {
      const location = cleanLocation({
        ...city,
        region: city.admin1 || '',
        country: city.country || city.country_code,
      })
      if (!seen.has(String(location.id))) {
        seen.add(String(location.id))
        results.push(location)
      }
    } catch {
      /* Records without valid coordinates/timezones cannot be selected. */
    }
  }
  return results
}
function numberOrNull(value, min = -Infinity, max = Infinity) {
  if (value === null) return null
  if (!Number.isFinite(value) || value < min || value > max) throw invalid()
  return value
}
export function normalizeWeather(json) {
  if (
    !json ||
    json.error ||
    !validTimezone(json.timezone) ||
    !Number.isFinite(json.utc_offset_seconds) ||
    !json.current ||
    !json.daily
  )
    throw invalid()
  const current = json.current,
    daily = json.daily
  if (
    !Number.isFinite(current.time) ||
    ![0, 1].includes(current.is_day) ||
    !Number.isFinite(current.temperature_2m)
  )
    throw invalid()
  if (
    json.daily_units?.temperature_2m_min !== '°C' ||
    json.daily_units?.temperature_2m_max !== '°C' ||
    json.daily_units?.time !== 'unixtime' ||
    json.current_units?.apparent_temperature !== '°C' ||
    json.current_units?.relative_humidity_2m !== '%' ||
    json.current_units?.temperature_2m !== '°C' ||
    json.current_units?.wind_speed_10m !== 'km/h' ||
    json.current_units?.pressure_msl !== 'hPa' ||
    json.current_units?.time !== 'unixtime'
  )
    throw invalid()
  const arrays = [
    'time',
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
    'sunrise',
    'sunset',
  ]
  if (arrays.some((key) => !Array.isArray(daily[key]) || daily[key].length < 5))
    throw invalid()
  const forecast = daily.time.slice(0, 5).map((time, i) => {
    if (!Number.isFinite(time)) throw invalid()
    const min = numberOrNull(daily.temperature_2m_min[i]),
      max = numberOrNull(daily.temperature_2m_max[i])
    if (min !== null && max !== null && min > max) throw invalid()
    return {
      date: dateFromApiDay(time, json.utc_offset_seconds),
      min,
      max,
      code: numberOrNull(daily.weather_code[i], 0, 999),
      sunrise: numberOrNull(daily.sunrise[i], 0),
      sunset: numberOrNull(daily.sunset[i], 0),
    }
  })
  if (
    new Set(forecast.map((day) => day.date)).size !== 5 ||
    forecast.some((day, i) => i && day.date <= forecast[i - 1].date)
  )
    throw invalid()
  return {
    timezone: json.timezone,
    timestamp: current.time * 1000,
    temperature: current.temperature_2m,
    feelsLike: numberOrNull(current.apparent_temperature),
    humidity: numberOrNull(current.relative_humidity_2m, 0, 100),
    wind: numberOrNull(current.wind_speed_10m, 0),
    pressure: numberOrNull(current.pressure_msl, 0),
    isDay: current.is_day === 1,
    code: numberOrNull(current.weather_code, 0, 999),
    forecast,
  }
}
export async function fetchWeather(location, options = {}) {
  const city = cleanLocation(location)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,sunrise,sunset',
    timezone: 'auto',
    timeformat: 'unixtime',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    forecast_days: '5',
  })
  return normalizeWeather(await requestJson(url.toString(), options))
}
