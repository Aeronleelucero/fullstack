<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { formatTemperature } from '../utils/temperature.js'
import { forecastDayLabel, formatForecastDate } from '../utils/dates.js'
import { weatherCondition } from '../utils/weatherCodes.js'
const props = defineProps({
  day: { type: Object, required: true },
  unit: String,
  timezone: String,
  now: Number,
  first: Boolean,
  range: Object,
})
const condition = computed(() => weatherCondition(props.day.code))
const bar = computed(() => {
  const width = props.range.max - props.range.min || 1
  return {
    left: `${Math.max(0, ((props.day.min - props.range.min) / width) * 100)}%`,
    width: `${Math.max(5, ((props.day.max - props.day.min) / width) * 100)}%`,
  }
})
</script>
<template>
  <article
    class="forecast-card glass-card"
    :class="{ 'forecast-first': first }"
  >
    <div class="forecast-date">
      <h3>{{ forecastDayLabel(day.date, timezone, now) }}</h3>
      <time :datetime="day.date">{{
        formatForecastDate(day.date, { month: 'short', day: 'numeric' })
      }}</time>
    </div>
    <WeatherIcon :code="day.code" :size="47" />
    <p class="forecast-condition">{{ condition.label }}</p>
    <div class="forecast-temperatures">
      <span
        ><span class="sr-only">Maximum </span
        >{{ formatTemperature(day.max, unit) }}°<span class="sr-only">{{
          unit.toUpperCase()
        }}</span></span
      ><span
        ><span class="sr-only">Minimum </span
        >{{ formatTemperature(day.min, unit) }}°<span class="sr-only">{{
          unit.toUpperCase()
        }}</span></span
      >
    </div>
    <div class="temperature-range" aria-hidden="true">
      <span v-if="day.min !== null && day.max !== null" :style="bar"></span>
    </div>
    <div class="forecast-labels" aria-hidden="true">
      <span>HIGH</span><span>LOW</span>
    </div>
  </article>
</template>
