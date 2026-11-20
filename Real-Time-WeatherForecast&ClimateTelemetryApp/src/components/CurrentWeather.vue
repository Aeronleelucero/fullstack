<script setup>
import { computed } from 'vue'
import { MapPin, ArrowUp, ArrowDown, Sun, Moon } from '@lucide/vue'
import WeatherIcon from './WeatherIcon.vue'
import { formatTemperature } from '../utils/temperature.js'
import { weatherCondition } from '../utils/weatherCodes.js'
import { formatLocal } from '../utils/dates.js'
const props = defineProps({
  data: { type: Object, required: true },
  location: { type: Object, required: true },
  unit: String,
  now: Number,
})
const condition = computed(() => weatherCondition(props.data.code))
const date = computed(() =>
  formatLocal(props.now, props.data.timezone, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }),
)
const time = computed(() =>
  formatLocal(props.now, props.data.timezone, {
    hour: '2-digit',
    minute: '2-digit',
  }),
)
</script>
<template>
  <section class="current-weather glass-card" aria-labelledby="current-city">
    <div class="current-top">
      <span class="eyebrow"
        ><MapPin :size="14" aria-hidden="true" /> SELECTED LOCATION</span
      ><span class="day-tag"
        ><Sun v-if="data.isDay" :size="13" aria-hidden="true" /><Moon
          v-else
          :size="13"
          aria-hidden="true"
        />{{ data.isDay ? 'Daytime' : 'Nighttime' }}</span
      >
    </div>
    <div class="current-layout">
      <div class="current-reading">
        <h2 id="current-city">{{ location.name }}</h2>
        <p class="current-country">
          {{
            [
              location.region !== location.name ? location.region : '',
              location.country,
            ]
              .filter(Boolean)
              .join(', ')
          }}
        </p>
        <p class="location-time">
          <time :datetime="new Date(now).toISOString()"
            >{{ date }} <span aria-hidden="true">·</span> {{ time }}</time
          >
        </p>
        <div class="temperature" role="group" aria-label="Current temperature">
          <span data-testid="current-temperature">{{
            formatTemperature(data.temperature, unit)
          }}</span
          ><span class="temperature-unit">°{{ unit.toUpperCase() }}</span>
        </div>
        <p class="current-condition">{{ condition.label }}</p>
        <p class="feels-like">
          Feels like
          <strong
            >{{ formatTemperature(data.feelsLike, unit) }}°{{
              unit.toUpperCase()
            }}</strong
          >
        </p>
      </div>
      <div
        class="weather-art"
        :class="{ 'art-night': !data.isDay }"
        aria-hidden="true"
      >
        <div class="weather-orbit orbit-one"></div>
        <div class="weather-orbit orbit-two"></div>
        <div class="weather-glow"></div>
        <span class="art-spark spark-one"></span
        ><span class="art-spark spark-two"></span
        ><WeatherIcon :code="data.code" :is-day="data.isDay" :size="156" />
      </div>
    </div>
    <div class="current-bottom">
      <div class="high-low">
        <span
          ><ArrowUp :size="15" aria-hidden="true" /> High
          <strong
            >{{ formatTemperature(data.forecast[0].max, unit) }}°</strong
          ></span
        ><span
          ><ArrowDown :size="15" aria-hidden="true" /> Low
          <strong
            >{{ formatTemperature(data.forecast[0].min, unit) }}°</strong
          ></span
        >
      </div>
      <span class="model-tag">Current model estimate</span>
    </div>
  </section>
</template>
