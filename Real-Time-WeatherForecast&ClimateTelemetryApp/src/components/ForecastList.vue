<script setup>
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import ForecastCard from './ForecastCard.vue'
const props = defineProps({
  forecast: { type: Array, required: true },
  unit: String,
  timezone: String,
  now: Number,
})
const range = computed(() => {
  const numbers = props.forecast
    .flatMap((day) => [day.min, day.max])
    .filter(Number.isFinite)
  return {
    min: numbers.length ? Math.min(...numbers) : 0,
    max: numbers.length ? Math.max(...numbers) : 1,
  }
})
</script>
<template>
  <section
    id="forecast"
    class="forecast-section"
    aria-labelledby="forecast-title"
  >
    <div class="section-heading">
      <div>
        <span class="eyebrow">A LITTLE LOOK AHEAD</span>
        <h2 id="forecast-title">The next five days.</h2>
      </div>
      <span class="section-note"
        ><CalendarDays :size="16" aria-hidden="true" /> Daily outlook · includes
        today</span
      >
    </div>
    <div class="forecast-grid">
      <ForecastCard
        v-for="(day, index) in forecast"
        :key="day.date"
        :day="day"
        :unit="unit"
        :timezone="timezone"
        :now="now"
        :first="index === 0"
        :range="range"
      />
    </div>
  </section>
</template>
