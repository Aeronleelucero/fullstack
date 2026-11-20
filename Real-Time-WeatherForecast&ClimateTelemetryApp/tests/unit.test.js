import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'
import {
  searchCities,
  fetchWeather,
  requestJson,
  normalizeWeather,
  WeatherApiError,
} from '../src/services/weatherApi.js'
import { useWeather, useCitySearch } from '../src/composables/useWeather.js'
import {
  createPreferences,
  PREFERENCES_KEY,
  validLocation,
} from '../src/utils/preferences.js'
import {
  convertTemperature,
  formatTemperature,
} from '../src/utils/temperature.js'
import { weatherCondition, weatherTheme } from '../src/utils/weatherCodes.js'
import {
  localDateKey,
  formatLocal,
  dateFromApiDay,
  formatForecastDate,
  forecastDayLabel,
} from '../src/utils/dates.js'
import { city, tokyo, payload, memoryStorage, deferred } from './fixtures.js'
const jsonResponse = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  })

test('global city search sends Unicode safely and retains ambiguous valid matches', async () => {
  let url
  const rows = [
    { ...city, admin1: city.region },
    { ...tokyo, name: 'São Paulo', admin1: 'São Paulo' },
  ]
  const results = await searchCities('  São Paulo  ', {
    fetchImpl: async (request) => {
      url = new URL(request)
      return jsonResponse({ results: rows })
    },
  })
  assert.equal(url.searchParams.get('name'), 'São Paulo')
  assert.equal(url.searchParams.get('count'), '8')
  assert.equal(results.length, 2)
  assert.equal(results[0].country, 'Philippines')
})
test('empty and one-character searches do not make network requests', async () => {
  let calls = 0
  const options = {
    fetchImpl: async () => {
      calls++
      return jsonResponse({})
    },
  }
  assert.deepEqual(await searchCities(' ', options), [])
  assert.deepEqual(await searchCities('a', options), [])
  assert.equal(calls, 0)
})
test('unknown cities return an honest empty result', async () =>
  assert.deepEqual(
    await searchCities('nowhere', { fetchImpl: async () => jsonResponse({}) }),
    [],
  ))
test('geocoding rejects malformed top-level responses', async () => {
  for (const value of [null, [], { results: 'invalid' }, { error: true }])
    await assert.rejects(
      searchCities('London', { fetchImpl: async () => jsonResponse(value) }),
      (error) => error.code === 'invalid-response',
    )
})
test('geocoding excludes invalid locations and duplicate identities', async () => {
  const result = await searchCities('Manila', {
    fetchImpl: async () =>
      jsonResponse({
        results: [
          city,
          city,
          { ...city, id: 2, latitude: 1000 },
          { ...city, id: 3, timezone: 'invalid/zone' },
        ],
      }),
  })
  assert.equal(result.length, 1)
})
test('request failures identify network errors without returning fake data', async () =>
  await assert.rejects(
    requestJson('https://example.test', {
      fetchImpl: async () => {
        throw new TypeError('network failed')
      },
    }),
    (error) => error.code === 'network',
  ))
test('429 response is an actionable rate-limit state', async () =>
  await assert.rejects(
    requestJson('https://example.test', {
      fetchImpl: async () => new Response('', { status: 429 }),
    }),
    (error) => error.code === 'rate-limit',
  ))
test('401 and 403 are explicit configuration failures', async () => {
  for (const status of [401, 403])
    await assert.rejects(
      requestJson('https://example.test', {
        fetchImpl: async () => new Response('', { status }),
      }),
      (error) => error.code === 'configuration',
    )
})
test('server failures and malformed JSON are reported precisely', async () => {
  await assert.rejects(
    requestJson('https://example.test', {
      fetchImpl: async () => new Response('', { status: 503 }),
    }),
    (error) => error.code === 'unavailable',
  )
  await assert.rejects(
    requestJson('https://example.test', {
      fetchImpl: async () => new Response('{bad'),
    }),
    (error) => error.code === 'invalid-response',
  )
})
test('requests time out and release their waiting state', async () => {
  await assert.rejects(
    requestJson('https://example.test', {
      timeoutMs: 10,
      fetchImpl: (url, { signal }) =>
        new Promise((resolve, reject) =>
          signal.addEventListener('abort', () =>
            reject(new DOMException('cancelled', 'AbortError')),
          ),
        ),
    }),
    (error) => error.code === 'timeout',
  )
})
test('external cancellation remains an AbortError rather than a network failure', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    requestJson('https://example.test', { signal: controller.signal }),
    (error) => error.name === 'AbortError',
  )
})
test('weather requests use one provider, five days, Celsius, explicit units, timezone, and Unix instants', async () => {
  let url
  const result = await fetchWeather(city, {
    fetchImpl: async (request) => {
      url = new URL(request)
      return jsonResponse(payload())
    },
  })
  assert.equal(url.hostname, 'api.open-meteo.com')
  assert.equal(url.searchParams.get('forecast_days'), '5')
  assert.equal(url.searchParams.get('timeformat'), 'unixtime')
  assert.equal(url.searchParams.get('timezone'), 'auto')
  assert.equal(url.searchParams.get('temperature_unit'), 'celsius')
  assert.equal(url.searchParams.get('wind_speed_unit'), 'kmh')
  assert.equal(result.forecast.length, 5)
})
test('normalization preserves genuine zero values and never treats null as zero', () => {
  const raw = payload({ temperature: 0 })
  raw.current.wind_speed_10m = 0
  raw.current.relative_humidity_2m = 0
  raw.current.apparent_temperature = null
  raw.current.pressure_msl = null
  const result = normalizeWeather(raw)
  assert.equal(result.temperature, 0)
  assert.equal(result.wind, 0)
  assert.equal(result.humidity, 0)
  assert.equal(result.pressure, null)
  assert.equal(result.feelsLike, null)
})
test('incomplete forecast, wrong units, invalid dates, and unknown timezone are rejected', () => {
  const cases = [
    (raw) => raw.daily.time.pop(),
    (raw) => (raw.current_units.temperature_2m = '°F'),
    (raw) => (raw.daily_units.temperature_2m_max = '°F'),
    (raw) => (raw.daily.time[1] = raw.daily.time[0]),
    (raw) => (raw.timezone = 'invalid/zone'),
    (raw) => (raw.current.relative_humidity_2m = 120),
    (raw) => (raw.daily.temperature_2m_min[0] = 40),
  ]
  for (const change of cases) {
    const raw = payload()
    change(raw)
    assert.throws(
      () => normalizeWeather(raw),
      (error) => error.code === 'invalid-response',
    )
  }
})
test('Celsius/Fahrenheit conversion is correct for freezing, boiling, negatives and zero', () => {
  assert.equal(convertTemperature(0, 'f'), 32)
  assert.equal(convertTemperature(100, 'f'), 212)
  assert.equal(convertTemperature(-40, 'f'), -40)
  assert.equal(convertTemperature(0, 'c'), 0)
  assert.equal(formatTemperature(-0.1, 'c'), '0')
  assert.equal(formatTemperature(null), '—')
  assert.equal(convertTemperature(NaN), null)
})
test('all supported WMO code families map to explicit descriptions', () => {
  for (const code of [
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77,
    80, 81, 82, 85, 86, 95, 96, 99,
  ])
    assert.notEqual(weatherCondition(code).kind, 'unknown')
  assert.equal(weatherCondition(999).label, 'Conditions unavailable')
  assert.equal(weatherCondition(null).kind, 'unknown')
})
test('backgrounds use provider day/night status for the selected city', () => {
  assert.equal(weatherTheme(0, true), 'sunny')
  assert.equal(weatherTheme(2, true), 'cloudy')
  assert.equal(weatherTheme(61, true), 'rainy')
  assert.equal(weatherTheme(95, true), 'stormy')
  assert.equal(weatherTheme(71, true), 'snowy')
  assert.equal(weatherTheme(0, false), 'night')
  assert.equal(weatherTheme(95, false), 'night')
  assert.equal(weatherTheme(999, true), 'calm')
})
test('weather loading starts synchronously and resolves real normalized data', async () => {
  const pending = deferred(),
    model = normalizeWeather(payload())
  let remembered
  const state = useWeather({
    load: () => pending.promise,
    onSuccess: (value) => (remembered = value),
    now: () => 123,
  })
  const run = state.selectLocation(city)
  assert.equal(state.loading.value, true)
  assert.equal(state.data.value, null)
  pending.resolve(model)
  await run
  assert.equal(state.loading.value, false)
  assert.equal(state.data.value, model)
  assert.equal(remembered.name, city.name)
  assert.equal(state.receivedAt.value, 123)
})
test('failed weather clears values and supports a real retry', async () => {
  let calls = 0
  const state = useWeather({
    load: async () => {
      if (++calls === 1)
        throw new WeatherApiError('network', 'Connection failed')
      return normalizeWeather(payload())
    },
  })
  await state.selectLocation(city)
  assert.equal(state.data.value, null)
  assert.equal(state.error.value.code, 'network')
  assert.equal(state.loading.value, false)
  await state.refresh()
  assert.equal(calls, 2)
  assert.equal(state.error.value, null)
  assert.equal(state.data.value.forecast.length, 5)
})
test('late weather response cannot overwrite the latest city, even if abort is ignored', async () => {
  const first = deferred(),
    second = deferred()
  const state = useWeather({
    load: (location) =>
      location.id === city.id ? first.promise : second.promise,
  })
  const a = state.selectLocation(city),
    b = state.selectLocation(tokyo)
  const latest = normalizeWeather(payload({ temperature: 18 }))
  second.resolve(latest)
  await b
  first.resolve(normalizeWeather(payload({ temperature: 30 })))
  await a
  assert.equal(state.location.value.name, 'Tokyo')
  assert.equal(state.data.value.temperature, 18)
  assert.equal(state.loading.value, false)
})
test('old weather failures cannot replace a new successful selection', async () => {
  const first = deferred()
  const state = useWeather({
    load: (location) =>
      location.id === city.id
        ? first.promise
        : Promise.resolve(normalizeWeather(payload())),
  })
  const a = state.selectLocation(city)
  await state.selectLocation(tokyo)
  first.reject(new WeatherApiError('network', 'Old failure'))
  await a
  assert.equal(state.error.value, null)
  assert.equal(state.location.value.name, 'Tokyo')
})
test('dispose aborts work and prevents late data commits', async () => {
  const pending = deferred()
  const state = useWeather({ load: () => pending.promise })
  const run = state.selectLocation(city)
  state.dispose()
  pending.resolve(normalizeWeather(payload()))
  await run
  assert.equal(state.data.value, null)
  assert.equal(state.loading.value, false)
})
test('city search exposes loading and no-match states', async () => {
  const pending = deferred()
  const state = useCitySearch({ search: () => pending.promise })
  const run = state.run('Unknown')
  assert.equal(state.loading.value, true)
  pending.resolve([])
  await run
  assert.equal(state.loading.value, false)
  assert.equal(state.searched.value, true)
  assert.deepEqual(state.results.value, [])
})
test('city-search stale responses and errors cannot replace newer results', async () => {
  const first = deferred()
  const state = useCitySearch({
    search: (query) =>
      query === 'Old' ? first.promise : Promise.resolve([tokyo]),
  })
  const a = state.run('Old')
  await state.run('Tokyo')
  first.resolve([city])
  await a
  assert.deepEqual(state.results.value, [tokyo])
  assert.equal(state.error.value, null)
})
test('city-search errors and reset are accessible state primitives', async () => {
  const state = useCitySearch({
    search: async () => {
      throw new WeatherApiError('rate-limit', 'Wait')
    },
  })
  await state.run('Tokyo')
  assert.equal(state.error.value.code, 'rate-limit')
  assert.equal(state.loading.value, false)
  state.reset()
  assert.equal(state.query.value, '')
  assert.equal(state.error.value, null)
  assert.equal(state.searched.value, false)
})
test('empty preference storage starts with defaults without writing', () => {
  const storage = memoryStorage(),
    prefs = createPreferences(storage)
  assert.equal(prefs.state.unit, 'c')
  assert.equal(prefs.state.theme, 'dark')
  assert.equal(prefs.state.location, null)
  assert.equal(storage.writes, 0)
})
test('only validated non-sensitive preferences persist and restore', () => {
  const storage = memoryStorage(),
    prefs = createPreferences(storage)
  prefs.setUnit('f')
  prefs.setTheme('light')
  prefs.setLocation({ ...city, apikey: 'must-not-be-stored' })
  const raw = JSON.parse(storage.getItem(PREFERENCES_KEY))
  assert.deepEqual(Object.keys(raw).sort(), [
    'location',
    'theme',
    'unit',
    'version',
  ])
  assert.equal(raw.location.apikey, undefined)
  const restored = createPreferences(storage)
  assert.equal(restored.state.unit, 'f')
  assert.equal(restored.state.theme, 'light')
  assert.deepEqual({ ...restored.state.location }, city)
})
test('malformed, unsupported and invalid preferences remain untouched', () => {
  for (const raw of [
    '{broken',
    'null',
    '[]',
    JSON.stringify({ version: 2 }),
    JSON.stringify({ version: 1, unit: 'x', theme: 'dark', location: null }),
  ]) {
    const storage = memoryStorage(raw),
      prefs = createPreferences(storage)
    prefs.setUnit('f')
    assert.equal(storage.getItem(PREFERENCES_KEY), raw)
    assert.equal(storage.writes, 0)
    assert.ok(prefs.warning.value)
  }
})
test('quota and denied access preserve working session preferences', () => {
  const storage = memoryStorage()
  storage.setItem = () => {
    throw new DOMException('Quota', 'QuotaExceededError')
  }
  const prefs = createPreferences(storage)
  prefs.setUnit('f')
  assert.equal(prefs.state.unit, 'f')
  assert.ok(prefs.warning.value)
  assert.equal(storage.getItem(PREFERENCES_KEY), null)
  const denied = createPreferences(null)
  denied.setTheme('light')
  assert.equal(denied.state.theme, 'light')
  assert.ok(denied.warning.value)
})
test('an external preference change is not overwritten', () => {
  const storage = memoryStorage(),
    prefs = createPreferences(storage)
  storage.setItem(PREFERENCES_KEY, '{external')
  prefs.setUnit('f')
  assert.equal(storage.getItem(PREFERENCES_KEY), '{external')
  assert.ok(prefs.warning.value)
})
test('location validation rejects impossible coordinates and timezones', () => {
  assert.equal(Boolean(validLocation({ ...city, latitude: 91 })), false)
  assert.equal(Boolean(validLocation({ ...city, timezone: 'made/up' })), false)
})
test('timezone formatting follows the selected city across a date boundary', () => {
  const instant = Date.parse('2026-11-20T23:30:00Z')
  assert.equal(localDateKey(instant, 'Asia/Tokyo'), '2026-11-21')
  assert.equal(localDateKey(instant, 'America/New_York'), '2026-11-20')
  assert.match(
    formatLocal(instant, 'Asia/Tokyo', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    /08:30/,
  )
})
test('IANA timezone formatting respects daylight saving transitions', () => {
  assert.match(
    formatLocal(Date.parse('2026-03-08T06:30:00Z'), 'America/New_York', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    /01:30/,
  )
  assert.match(
    formatLocal(Date.parse('2026-03-08T07:30:00Z'), 'America/New_York', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    /03:30/,
  )
})
test('forecast date-only labels never shift with the browser timezone', () => {
  assert.equal(dateFromApiDay(payload().daily.time[0], 28800), '2026-11-20')
  assert.equal(formatForecastDate('2026-11-20'), 'Fri')
  assert.equal(
    forecastDayLabel(
      '2026-11-20',
      'Asia/Manila',
      Date.parse('2026-11-20T06:00:00Z'),
    ),
    'Today',
  )
})
let vite, ForecastList
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: 'custom',
    logLevel: 'error',
  })
  ForecastList = (await vite.ssrLoadModule('/src/components/ForecastList.vue'))
    .default
})
after(async () => {
  await vite?.close()
})
test('real Vue forecast component renders exactly five dates and genuine min/max values', async () => {
  const model = normalizeWeather(payload())
  const html = await renderToString(
    createSSRApp(ForecastList, {
      forecast: model.forecast,
      unit: 'c',
      timezone: model.timezone,
      now: Date.parse('2026-11-20T06:00:00Z'),
    }),
  )
  assert.equal((html.match(/class="forecast-card /g) || []).length, 5)
  assert.match(html, /Today/)
  assert.match(html, /2026-11-24/)
  assert.match(html, /Maximum/)
  assert.match(html, /31°/)
  assert.match(html, /24°/)
})
test('forecast component changes temperatures locally for Fahrenheit', async () => {
  const model = normalizeWeather(payload())
  const html = await renderToString(
    createSSRApp(ForecastList, {
      forecast: model.forecast,
      unit: 'f',
      timezone: model.timezone,
      now: Date.parse('2026-11-20T06:00:00Z'),
    }),
  )
  assert.match(html, /88°/)
  assert.match(html, /75°/)
})
