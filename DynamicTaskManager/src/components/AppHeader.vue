<script setup>
import { computed } from 'vue'
import {
  Menu,
  Moon,
  Sun,
  CalendarDays,
  CheckCheck,
  CloudOff,
} from '@lucide/vue'
import { useTheme } from '../composables/useTheme.js'
import { useTasksStore } from '../stores/tasks.js'
const store = useTasksStore()
const { theme, toggleTheme } = useTheme()
defineEmits(['menu'])
defineProps({ menuOpen: Boolean })
const viewTitle = computed(
  () =>
    ({
      overview: 'Overview',
      all: 'All tasks',
      today: 'Today',
      upcoming: 'Upcoming',
      completed: 'Completed',
    })[store.view] || store.view,
)
const date = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${store.today}T12:00:00`)),
)
</script>
<template>
  <header class="app-header">
    <div class="header-left">
      <button
        type="button"
        class="icon-button mobile-menu-button"
        aria-label="Open navigation"
        aria-controls="app-sidebar"
        :aria-expanded="menuOpen"
        @click="$emit('menu')"
      >
        <Menu :size="22" aria-hidden="true" /></button
      ><span class="header-workspace">Momentum</span
      ><span class="header-slash" aria-hidden="true">/</span
      ><strong>{{ viewTitle }}</strong>
    </div>
    <div class="header-right">
      <span
        class="save-status"
        :class="{ 'not-saved': store.unsaved || store.readOnly }"
        ><CloudOff
          v-if="store.unsaved || store.readOnly"
          :size="15"
          aria-hidden="true"
        /><CheckCheck v-else :size="15" aria-hidden="true" /><span>{{
          store.unsaved
            ? 'Changes not saved'
            : store.readOnly
              ? 'Storage needs attention'
              : 'Saved on this browser'
        }}</span></span
      ><span class="header-date"
        ><CalendarDays :size="15" aria-hidden="true" />{{ date }}</span
      ><button
        type="button"
        class="icon-button theme-toggle"
        :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" :size="19" aria-hidden="true" /><Moon
          v-else
          :size="19"
          aria-hidden="true"
        />
      </button>
    </div>
  </header>
</template>
