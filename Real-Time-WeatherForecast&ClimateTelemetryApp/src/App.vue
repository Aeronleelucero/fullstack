<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  RefreshCw,
  Globe2,
  Sunrise,
  Sunset,
  Info,
  CloudSun,
} from '@lucide/vue'
import AppHeader from './components/AppHeader.vue'
import CurrentWeather from './components/CurrentWeather.vue'
import WeatherDetails from './components/WeatherDetails.vue'
import ForecastList from './components/ForecastList.vue'
import WeatherBackground from './components/WeatherBackground.vue'
import WeatherSkeleton from './components/WeatherSkeleton.vue'
import ErrorState from './components/ErrorState.vue'
import { createPreferences } from './utils/preferences.js'
import { formatLocal } from './utils/dates.js'
import { DEFAULT_LOCATION } from './services/defaultLocation.js'
import { useTheme } from './composables/useTheme.js'
import { useWeather } from './composables/useWeather.js'
const preferences = createPreferences()
const { theme, toggleTheme } = useTheme(preferences)
const {
  location,
  data,
  error,
  loading,
  receivedAt,
  atmosphere,
  selectLocation,
  refresh,
  dispose,
} = useWeather({ onSuccess: preferences.setLocation })
const now = ref(Date.now()),
  announcement = ref('')
const stale = computed(
  () => data.value && now.value - data.value.timestamp > 45 * 60000,
)
const updated = computed(() =>
  data.value
    ? formatLocal(data.value.timestamp, data.value.timezone, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '',
)
const solarTime = (seconds) =>
  seconds === null
    ? 'Unavailable'
    : formatLocal(seconds * 1000, data.value.timezone, {
        hour: '2-digit',
        minute: '2-digit',
      })
let timer
watch([loading, error], () => {
  announcement.value = loading.value
    ? `Loading weather for ${location.value?.name}.`
    : error.value
      ? error.value.message
      : data.value
        ? `Weather and five-day forecast loaded for ${location.value.name}, ${location.value.country}.`
        : ''
})
function tick() {
  now.value = Date.now()
  if (
    !document.hidden &&
    data.value &&
    receivedAt.value &&
    now.value - receivedAt.value >= 15 * 60000
  )
    refresh()
}
onMounted(() => {
  selectLocation(preferences.state.location || DEFAULT_LOCATION)
  timer = setInterval(tick, 30000)
  document.addEventListener('visibilitychange', tick)
})
onUnmounted(() => {
  clearInterval(timer)
  dispose()
  document.removeEventListener('visibilitychange', tick)
})
</script>
<template>
  <WeatherBackground :atmosphere="atmosphere" />
  <a class="skip-link" href="#main-content">Skip to weather</a>
  <AppHeader
    :unit="preferences.state.unit"
    :theme="theme"
    @select="selectLocation"
    @unit="preferences.setUnit"
    @theme="toggleTheme"
  />
  <main id="main-content" tabindex="-1" class="main-content">
    <div class="page-intro">
      <div>
        <p class="eyebrow intro-eyebrow">
          <span class="tiny-star" aria-hidden="true">✦</span> A CLEARER VIEW OF
          YOUR WORLD
        </p>
        <h1>A little closer to the sky.</h1>
        <p class="intro-description">
          The conditions now. The possibilities ahead.
        </p>
      </div>
      <nav class="view-navigation" aria-label="Weather sections">
        <a href="#conditions" class="view-link">Overview</a
        ><a href="#forecast" v-if="data" class="view-link">5-day forecast</a>
      </nav>
    </div>
    <p v-if="preferences.warning.value" class="preference-notice" role="status">
      <Info :size="17" aria-hidden="true" />{{ preferences.warning.value }}
    </p>
    <div id="conditions" class="conditions-header">
      <h2>Current conditions</h2>
      <div class="conditions-actions">
        <span v-if="data" class="update-label"
          ><span class="status-dot" :class="{ stale }"></span
          >{{ stale ? 'Earlier estimate' : 'As of' }}
          {{ updated }}</span
        ><button
          type="button"
          class="refresh-button"
          :disabled="loading || !location"
          aria-label="Refresh weather"
          @click="refresh"
        >
          <RefreshCw
            :size="15"
            :class="{ spin: loading }"
            aria-hidden="true"
          /><span>Refresh</span>
        </button>
      </div>
    </div>
    <WeatherSkeleton v-if="loading" />
    <ErrorState
      v-else-if="error"
      :error="error"
      :location="location"
      @retry="refresh"
    />
    <template v-else-if="data">
      <p v-if="stale" class="stale-notice" role="status">
        This model estimate is over 45 minutes old. Refresh for the latest
        available data.
      </p>
      <div class="dashboard-grid">
        <CurrentWeather
          :data="data"
          :location="location"
          :unit="preferences.state.unit"
          :now="now"
        /><WeatherDetails :data="data" />
      </div>
      <ForecastList
        :forecast="data.forecast"
        :unit="preferences.state.unit"
        :timezone="data.timezone"
        :now="now"
      />
      <section
        class="local-perspective glass-card"
        aria-label="Location and daylight"
      >
        <div class="perspective-heading">
          <span class="perspective-icon"
            ><Globe2 :size="24" aria-hidden="true"
          /></span>
          <div>
            <h2>A local perspective.</h2>
            <p>
              {{ data.timezone.replaceAll('_', ' ') }}
              <span aria-hidden="true">·</span>
              {{ Math.abs(location.latitude).toFixed(2) }}°{{
                location.latitude < 0 ? 'S' : 'N'
              }}, {{ Math.abs(location.longitude).toFixed(2) }}°{{
                location.longitude < 0 ? 'W' : 'E'
              }}
            </p>
          </div>
        </div>
        <div class="solar-stat">
          <Sunrise :size="22" aria-hidden="true" />
          <div>
            <span>Sunrise today</span
            ><strong>{{ solarTime(data.forecast[0].sunrise) }}</strong>
          </div>
        </div>
        <div class="solar-stat">
          <Sunset :size="22" aria-hidden="true" />
          <div>
            <span>Sunset today</span
            ><strong>{{ solarTime(data.forecast[0].sunset) }}</strong>
          </div>
        </div>
      </section>
      <p class="data-context">
        <Info :size="15" aria-hidden="true" />Current conditions are model
        estimates, not station observations. Forecasts include today and refresh
        every 15 minutes while this tab is visible.
      </p>
    </template>
    <footer class="app-footer">
      <div class="footer-brand">
        <CloudSun :size="19" aria-hidden="true" /><span>atmos</span
        ><span class="footer-tagline">A moment of perspective.</span>
      </div>
      <p>
        Weather by
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          >Open-Meteo</a
        >
        · Locations by
        <a
          href="https://www.geonames.org/"
          target="_blank"
          rel="noopener noreferrer"
          >GeoNames</a
        ><span>Searches and coordinates are sent to Open-Meteo.</span>
      </p>
    </footer>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ announcement }}
    </p>
  </main>
</template>
