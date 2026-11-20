<template>
  <div class="weather-loading" role="status" aria-live="polite">
    <span class="sr-only"
      >Loading current weather and the five-day forecast.</span
    >
    <div class="dashboard-grid" aria-hidden="true">
      <div class="glass-card skeleton-hero">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-temperature"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-orb"></div>
      </div>
      <div class="skeleton-details">
        <div v-for="n in 3" :key="n" class="glass-card skeleton-detail">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>
    <div class="skeleton-forecast" aria-hidden="true">
      <div v-for="n in 5" :key="n" class="glass-card skeleton-forecast-card">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-circle"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  </div>
</template>
