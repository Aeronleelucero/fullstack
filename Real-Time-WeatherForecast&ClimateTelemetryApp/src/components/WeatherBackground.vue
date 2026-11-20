<script setup>
defineProps({ atmosphere: { type: String, default: 'calm' } })
</script>
<template>
  <div
    class="weather-background"
    :class="`atmosphere-${atmosphere}`"
    aria-hidden="true"
  >
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div v-if="atmosphere === 'night'" class="star-field"></div>
    <div
      v-if="['cloudy', 'snowy'].includes(atmosphere)"
      class="cloud-drift"
    ></div>
    <div
      v-if="['rainy', 'stormy'].includes(atmosphere)"
      class="rain-field"
    ></div>
    <div class="background-grid"></div>
  </div>
</template>
