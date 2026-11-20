<script setup>
import {
  Sparkles,
  BriefcaseBusiness,
  UserRound,
  GraduationCap,
} from '@lucide/vue'
import { useTasksStore } from '../stores/tasks.js'
const store = useTasksStore()
const categoryIcons = {
  Work: BriefcaseBusiness,
  Personal: UserRound,
  Study: GraduationCap,
}
</script>
<template>
  <aside class="insights-column" aria-label="Workspace progress">
    <section class="panel progress-panel">
      <div class="panel-heading">
        <h2>Small wins add up.</h2>
        <Sparkles :size="17" class="accent" aria-hidden="true" />
      </div>
      <div
        class="progress-ring"
        :style="{ '--completion': `${store.stats.percentage}%` }"
        role="meter"
        aria-label="Overall task completion"
        :aria-valuenow="store.stats.percentage"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuetext="`${store.stats.completed} of ${store.stats.total} tasks completed`"
      >
        <div>
          <strong>{{ store.stats.percentage }}<span>%</span></strong
          ><span>completed</span>
        </div>
      </div>
      <p class="progress-caption">
        {{ store.stats.completed }}
        <span>of {{ store.stats.total }} tasks completed</span>
      </p>
      <p class="progress-note">
        {{
          store.stats.total === 0
            ? 'Your next chapter starts here.'
            : store.stats.completed === store.stats.total
              ? 'Take a moment. You earned it.'
              : 'Every checked box is a step forward.'
        }}
      </p>
      <div class="progress-legend">
        <span
          ><i class="legend-done"></i>Completed
          <strong>{{ store.stats.completed }}</strong></span
        ><span
          ><i class="legend-active"></i>Active
          <strong>{{ store.stats.active }}</strong></span
        >
      </div>
    </section>
    <section class="panel category-panel">
      <div class="panel-heading">
        <h2>By category</h2>
        <span class="small-label"
          >{{ store.categoryStats.length }} categories</span
        >
      </div>
      <button
        v-for="category in store.categoryStats"
        :key="category.name"
        type="button"
        class="category-summary"
        :class="category.name.toLowerCase()"
        @click="store.setView(category.name)"
      >
        <span class="category-summary-icon"
          ><component
            :is="categoryIcons[category.name]"
            :size="18"
            aria-hidden="true" /></span
        ><span>{{ category.name }}</span
        ><strong>{{ category.total }}</strong>
      </button>
    </section>
    <div class="gentle-note">
      <Sparkles :size="20" aria-hidden="true" />
      <p>
        You don’t have to do it all today.<br /><strong
          >Just take the next small step.</strong
        >
      </p>
    </div>
  </aside>
</template>
