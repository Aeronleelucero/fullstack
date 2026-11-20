// Synthetic measurements for automated tests only. Never imported by src/.
export const city = {
  id: 1701668,
  name: 'Manila',
  country: 'Philippines',
  region: 'National Capital Region',
  latitude: 14.6042,
  longitude: 120.9822,
  timezone: 'Asia/Manila',
}
export const tokyo = {
  id: 1850147,
  name: 'Tokyo',
  country: 'Japan',
  region: 'Tokyo',
  latitude: 35.6895,
  longitude: 139.69171,
  timezone: 'Asia/Tokyo',
}
export function payload({ code = 2, isDay = 1, temperature = 28.4 } = {}) {
  const dates = [
    '2026-11-20',
    '2026-11-21',
    '2026-11-22',
    '2026-11-23',
    '2026-11-24',
  ]
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: 'Asia/Manila',
    utc_offset_seconds: 28800,
    current_units: {
      time: 'unixtime',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      wind_speed_10m: 'km/h',
      pressure_msl: 'hPa',
    },
    current: {
      time: Date.parse('2026-11-20T06:00:00Z') / 1000,
      temperature_2m: temperature,
      apparent_temperature: 31.2,
      relative_humidity_2m: 72,
      wind_speed_10m: 12.4,
      pressure_msl: 1011.8,
      weather_code: code,
      is_day: isDay,
    },
    daily_units: {
      time: 'unixtime',
      temperature_2m_min: '°C',
      temperature_2m_max: '°C',
      sunrise: 'unixtime',
      sunset: 'unixtime',
    },
    daily: {
      time: dates.map((date) => Date.parse(`${date}T00:00:00+08:00`) / 1000),
      weather_code: [2, 0, 61, 95, 3],
      temperature_2m_min: [24, 25, 23, 24, 25],
      temperature_2m_max: [31, 33, 29, 30, 32],
      sunrise: dates.map((date) => Date.parse(`${date}T06:00:00+08:00`) / 1000),
      sunset: dates.map((date) => Date.parse(`${date}T17:30:00+08:00`) / 1000),
    },
  }
}
export function memoryStorage(value = null) {
  let raw = value
  return {
    writes: 0,
    getItem() {
      return raw
    },
    setItem(key, value) {
      this.writes++
      raw = value
    },
  }
}
export function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
