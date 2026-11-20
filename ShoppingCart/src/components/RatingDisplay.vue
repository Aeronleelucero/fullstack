<script setup>
import { Star } from '@lucide/vue'
defineProps({ rating: { type: Object, required: true } })
</script>
<template>
  <p class="rating">
    <Star :size="14" fill="currentColor" aria-hidden="true" /><span
      >{{ rating.rate.toFixed(1) }}<span class="sr-only"> out of 5</span></span
    ><span class="rating-count"
      >({{ rating.count }}<span class="sr-only"> catalog reviews</span>)</span
    >
  </p>
</template>
