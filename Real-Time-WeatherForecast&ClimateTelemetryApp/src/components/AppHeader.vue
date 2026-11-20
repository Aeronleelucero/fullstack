<script setup>
import { CloudSun, Sun, Moon } from '@lucide/vue'
import CitySearch from './CitySearch.vue'
import UnitToggle from './UnitToggle.vue'
defineProps({ unit: String, theme: String })
defineEmits(['select', 'unit', 'theme'])
</script>
<template>
  <header class="app-header">
    <div class="header-inner">
      <a class="brand" href="#main-content"
        ><span class="brand-icon"
          ><CloudSun :size="27" :stroke-width="1.5" aria-hidden="true" /></span
        ><span
          >atmos<span class="brand-subtitle"
            >WEATHER, IN PERSPECTIVE</span
          ></span
        ></a
      >
      <CitySearch @select="$emit('select', $event)" />
      <div class="header-controls">
        <UnitToggle :unit="unit" @change="$emit('unit', $event)" /><span
          class="control-divider"
          aria-hidden="true"
        ></span
        ><button
          type="button"
          class="icon-button theme-toggle"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
          @click="$emit('theme')"
        >
          <Sun v-if="theme === 'dark'" :size="20" aria-hidden="true" /><Moon
            v-else
            :size="20"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </header>
</template>
