<script setup>
import { Droplets, Wind, Gauge } from '@lucide/vue'
defineProps({ data: { type: Object, required: true } })
const number = (value, precision = 1) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('en', { maximumFractionDigits: precision }).format(
        value,
      )
    : '—'
</script>
<template>
  <section class="weather-details" aria-label="Weather details">
    <article class="detail-card glass-card">
      <span class="detail-icon humidity-icon"
        ><Droplets :size="23" aria-hidden="true"
      /></span>
      <div class="detail-content">
        <h3>Humidity</h3>
        <p class="detail-value">{{ number(data.humidity) }}<span>%</span></p>
        <p class="detail-caption">Relative humidity</p>
      </div>
      <div
        v-if="data.humidity !== null"
        class="humidity-meter"
        role="meter"
        aria-label="Relative humidity"
        :aria-valuenow="data.humidity"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="{ height: `${data.humidity}%` }"></span>
      </div>
    </article>
    <article class="detail-card glass-card">
      <span class="detail-icon wind-icon"
        ><Wind :size="23" aria-hidden="true"
      /></span>
      <div class="detail-content">
        <h3>Wind speed</h3>
        <p class="detail-value">{{ number(data.wind) }}<span>km/h</span></p>
        <p class="detail-caption">At 10 metres above ground</p>
      </div>
      <div class="wind-lines" aria-hidden="true"><i></i><i></i><i></i></div>
    </article>
    <article class="detail-card glass-card">
      <span class="detail-icon pressure-icon"
        ><Gauge :size="23" aria-hidden="true"
      /></span>
      <div class="detail-content">
        <h3>Air pressure</h3>
        <p class="detail-value">
          {{ number(data.pressure, 0) }}<span>hPa</span>
        </p>
        <p class="detail-caption">Reduced to sea level</p>
      </div>
      <Gauge :size="45" class="detail-decoration" aria-hidden="true" />
    </article>
  </section>
</template>
