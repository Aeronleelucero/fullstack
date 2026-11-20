<script setup>
import { CloudOff, RefreshCw } from '@lucide/vue'
defineProps({ error: Object, location: Object })
defineEmits(['retry'])
</script>
<template>
  <section class="error-state glass-card" aria-labelledby="weather-error-title">
    <span class="error-illustration"
      ><CloudOff :size="46" :stroke-width="1.3" aria-hidden="true"
    /></span>
    <p class="eyebrow">A PAUSE IN THE FORECAST</p>
    <h2 id="weather-error-title">
      {{
        error.code === 'rate-limit'
          ? 'A moment to catch our breath.'
          : 'The weather is out of reach.'
      }}
    </h2>
    <p role="alert">{{ error.message }}</p>
    <p v-if="location" class="error-city">
      Requested location: {{ location.name }}, {{ location.country }}
    </p>
    <button type="button" class="button-primary" @click="$emit('retry')">
      <RefreshCw :size="17" aria-hidden="true" />Try again
    </button>
    <p class="error-hint">You can also search for another city above.</p>
  </section>
</template>
