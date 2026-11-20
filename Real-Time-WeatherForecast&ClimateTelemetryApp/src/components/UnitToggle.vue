<script setup>
defineProps({ unit: { type: String, required: true } })
defineEmits(['change'])
</script>
<template>
  <div class="unit-toggle" role="group" aria-label="Temperature unit">
    <button
      v-for="value in ['c', 'f']"
      :key="value"
      type="button"
      :aria-pressed="unit === value"
      :aria-label="value === 'c' ? '°C — Celsius' : '°F — Fahrenheit'"
      @click="$emit('change', value)"
    >
      °{{ value.toUpperCase() }}
    </button>
  </div>
</template>
