<script setup>
import { computed } from 'vue'
import { Layers, CircleDashed, CircleCheck, Clock3 } from '@lucide/vue'
import { useTasksStore } from '../stores/tasks.js'
const store = useTasksStore()
const cards = computed(() => [
  {
    label: 'Total tasks',
    value: store.stats.total,
    icon: Layers,
    tone: 'purple',
    hint: 'Everything in your workspace',
  },
  {
    label: 'Active tasks',
    value: store.stats.active,
    icon: CircleDashed,
    tone: 'blue',
    hint: `${store.stats.today} due today`,
  },
  {
    label: 'Completed',
    value: store.stats.completed,
    icon: CircleCheck,
    tone: 'green',
    hint: `${store.stats.percentage}% completion rate`,
  },
  {
    label: 'Overdue',
    value: store.stats.overdue,
    icon: Clock3,
    tone: 'amber',
    hint: store.stats.overdue
      ? 'A little attention needed'
      : 'You’re all caught up',
  },
])
</script>
<template>
  <section
    class="stats-grid grid grid-cols-2 gap-4 xl:grid-cols-4"
    aria-label="Task statistics"
  >
    <article
      v-for="card in cards"
      :key="card.label"
      class="stat-card"
      :class="card.tone"
    >
      <div class="stat-heading">
        <span>{{ card.label }}</span><span class="stat-icon"
          ><component :is="card.icon" :size="18" aria-hidden="true"
        /></span>
      </div>
      <strong class="stat-value" :data-stat="card.label">{{
        card.value
      }}</strong>
      <p>{{ card.hint }}</p>
    </article>
  </section>
</template>
