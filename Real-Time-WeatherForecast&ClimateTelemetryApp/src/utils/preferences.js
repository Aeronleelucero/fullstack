import { reactive, ref } from 'vue'
import { validTimezone } from './dates.js'
export const PREFERENCES_KEY = 'atmos.preferences.v1'
export function validLocation(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (typeof value.id === 'number' || typeof value.id === 'string') &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    value.name.length <= 150 &&
    typeof value.country === 'string' &&
    value.country.length > 0 &&
    value.country.length <= 150 &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180 &&
    validTimezone(value.timezone)
  )
}
export function cleanLocation(value) {
  if (!validLocation(value)) throw new Error('Invalid location')
  return {
    id: value.id,
    name: value.name,
    country: value.country,
    region: typeof value.region === 'string' ? value.region.slice(0, 150) : '',
    latitude: value.latitude,
    longitude: value.longitude,
    timezone: value.timezone,
  }
}
function getStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}
export function createPreferences(storage = getStorage()) {
  const state = reactive({ unit: 'c', theme: 'dark', location: null })
  const warning = ref('')
  let snapshot = null,
    locked = false
  try {
    if (!storage) throw new Error('Storage unavailable')
    snapshot = storage.getItem(PREFERENCES_KEY)
    if (snapshot !== null) {
      const saved = JSON.parse(snapshot)
      if (
        !saved ||
        saved.version !== 1 ||
        !['c', 'f'].includes(saved.unit) ||
        !['dark', 'light'].includes(saved.theme) ||
        (saved.location !== null && !validLocation(saved.location))
      )
        throw new Error('Invalid preferences')
      state.unit = saved.unit
      state.theme = saved.theme
      state.location = saved.location ? cleanLocation(saved.location) : null
    }
  } catch {
    locked = true
    warning.value =
      'Saved preferences could not be read. Your original data is unchanged; preferences will apply only to this session.'
  }
  function save() {
    if (locked) return false
    try {
      if (storage.getItem(PREFERENCES_KEY) !== snapshot)
        throw new Error('Preferences changed elsewhere')
      const raw = JSON.stringify({
        version: 1,
        unit: state.unit,
        theme: state.theme,
        location: state.location ? cleanLocation(state.location) : null,
      })
      storage.setItem(PREFERENCES_KEY, raw)
      snapshot = raw
      warning.value = ''
      return true
    } catch {
      warning.value =
        'Preferences could not be saved. Your choices still work in this session.'
      return false
    }
  }
  function setUnit(unit) {
    if (!['c', 'f'].includes(unit)) return
    state.unit = unit
    save()
  }
  function setTheme(theme) {
    if (!['dark', 'light'].includes(theme)) return
    state.theme = theme
    save()
  }
  function setLocation(location) {
    state.location = cleanLocation(location)
    save()
  }
  return { state, warning, setUnit, setTheme, setLocation }
}
