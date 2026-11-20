<script setup>
import { computed } from 'vue'
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudHail,
  CircleHelp,
} from '@lucide/vue'
import { weatherCondition } from '../utils/weatherCodes.js'
const props = defineProps({
  code: { type: Number, default: null },
  isDay: { type: Boolean, default: true },
  size: { type: Number, default: 48 },
})
const condition = computed(() => weatherCondition(props.code))
const icon = computed(
  () =>
    ({
      clear: props.isDay ? Sun : Moon,
      partly: props.isDay ? CloudSun : CloudMoon,
      cloudy: Cloud,
      fog: CloudFog,
      rain: CloudRain,
      storm: CloudLightning,
      snow: Snowflake,
      sleet: CloudHail,
      unknown: CircleHelp,
    })[condition.value.kind],
)
</script>
<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="1.5"
    class="weather-icon"
    :class="[condition.kind, { 'night-icon': !isDay }]"
    aria-hidden="true"
  />
</template>
