import { computed, ref, shallowRef } from 'vue'
import { fetchWeather, searchCities } from '../services/weatherApi.js'
import { weatherTheme } from '../utils/weatherCodes.js'
import { cleanLocation } from '../utils/preferences.js'
export function useWeather({
  load = fetchWeather,
  onSuccess = () => {},
  now = Date.now,
} = {}) {
  const location = shallowRef(null),
    data = shallowRef(null),
    error = shallowRef(null),
    loading = ref(false),
    receivedAt = ref(null)
  let controller,
    generation = 0
  const atmosphere = computed(() =>
    data.value ? weatherTheme(data.value.code, data.value.isDay) : 'calm',
  )
  async function selectLocation(city) {
    const selected = cleanLocation(city)
    const current = ++generation
    controller?.abort()
    controller = new AbortController()
    location.value = selected
    data.value = null
    error.value = null
    receivedAt.value = null
    loading.value = true
    try {
      const result = await load(selected, { signal: controller.signal })
      if (current !== generation) return
      data.value = result
      receivedAt.value = now()
      onSuccess(selected)
    } catch (failure) {
      if (current !== generation || failure.name === 'AbortError') return
      error.value = {
        code: failure.code || 'network',
        message:
          failure.message || 'Weather could not be loaded. Please try again.',
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  function refresh() {
    if (location.value && !loading.value) return selectLocation(location.value)
  }
  function dispose() {
    generation++
    controller?.abort()
    loading.value = false
  }
  return {
    location,
    data,
    error,
    loading,
    receivedAt,
    atmosphere,
    selectLocation,
    refresh,
    dispose,
  }
}
export function useCitySearch({ search = searchCities } = {}) {
  const query = ref(''),
    results = shallowRef([]),
    loading = ref(false),
    error = shallowRef(null),
    searched = ref(false)
  let generation = 0,
    controller
  function cancel() {
    generation++
    controller?.abort()
    loading.value = false
  }
  function reset() {
    cancel()
    query.value = ''
    results.value = []
    error.value = null
    searched.value = false
  }
  async function run(value = query.value) {
    cancel()
    query.value = value
    results.value = []
    error.value = null
    searched.value = false
    if (Array.from(value.trim()).length < 2) return
    const current = generation
    controller = new AbortController()
    loading.value = true
    try {
      const matches = await search(value, { signal: controller.signal })
      if (current !== generation) return
      results.value = matches
      searched.value = true
    } catch (failure) {
      if (current === generation && failure.name !== 'AbortError') {
        error.value = failure
        searched.value = true
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  return { query, results, loading, error, searched, run, reset, cancel }
}
