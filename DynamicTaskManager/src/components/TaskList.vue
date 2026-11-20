<script setup>
import { ref, nextTick } from 'vue'
import { ListTodo, GripVertical, SearchX, Sparkles, Plus } from '@lucide/vue'
import { useTasksStore } from '../stores/tasks.js'
import TaskFilters from './TaskFilters.vue'
import TaskCard from './TaskCard.vue'
const store = useTasksStore()
const draggedId = ref(null)
const emit = defineEmits(['edit', 'delete', 'new-task', 'error'])
async function act(fn) {
  const focusedTaskId =
    document.activeElement?.closest('[data-task-id]')?.dataset.taskId
  try {
    fn()
    await nextTick()
    if (
      focusedTaskId &&
      !store.visibleTasks.some((task) => task.id === focusedTaskId)
    )
      document.getElementById('tasks-heading')?.focus({ preventScroll: true })
  } catch (error) {
    emit('error', error.message)
  }
}
function dropTask({ sourceId, targetId, placement }) {
  if (sourceId !== draggedId.value) return
  act(() => store.reorderTask(sourceId, targetId, placement))
  draggedId.value = null
}
</script>
<template>
  <section class="task-list-panel panel" aria-labelledby="tasks-heading">
    <div class="panel-heading">
      <div class="panel-title">
        <ListTodo :size="20" aria-hidden="true" />
        <h2 id="tasks-heading" tabindex="-1">Your tasks</h2>
        <span class="count-badge">{{ store.tasks.length }}</span>
      </div>
      <span class="manual-order"
        ><GripVertical :size="14" aria-hidden="true" /> Manual order</span
      >
    </div>
    <TaskFilters />
    <p class="sr-only" role="status">
      {{ store.visibleTasks.length }} matching tasks
    </p>
    <TransitionGroup
      v-if="store.visibleTasks.length"
      name="task"
      tag="ul"
      class="task-list"
      aria-label="Task list"
      ><TaskCard
        v-for="(task, index) in store.visibleTasks"
        :key="task.id"
        :task="task"
        :today="store.today"
        :first="index === 0"
        :last="index === store.visibleTasks.length - 1"
        :read-only="store.readOnly"
        :dragging="draggedId === task.id"
        @toggle="act(() => store.toggleTask($event))"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @move="(id, direction) => act(() => store.moveTask(id, direction))"
        @drag="draggedId = $event"
        @dragend="draggedId = null"
        @drop-task="dropTask"
    /></TransitionGroup>
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <SearchX
          v-if="store.hasFilters"
          :size="31"
          aria-hidden="true"
        /><ListTodo v-else :size="34" aria-hidden="true" /><span
          class="empty-sparkle"
          aria-hidden="true"
          >✦</span
        >
      </div>
      <h3>
        {{
          store.hasFilters
            ? 'Nothing here, just yet.'
            : 'Great things start with one task.'
        }}
      </h3>
      <p>
        {{
          store.hasFilters
            ? 'Try a different search or clear your filters to find what you’re looking for.'
            : 'A small step, a fresh idea, a thing you’ve been meaning to do. Let’s get it out of your head.'
        }}
      </p>
      <button
        v-if="store.hasFilters"
        type="button"
        class="button button-secondary"
        @click="store.resetFilters"
      >
        Clear filters</button
      ><button
        v-else
        type="button"
        class="button button-soft"
        :disabled="store.readOnly"
        @click="emit('new-task')"
      >
        <Plus :size="16" aria-hidden="true" /> Create your first task
      </button>
    </div>
    <div class="task-list-footer">
      <span
        >Showing {{ store.visibleTasks.length }} of
        {{ store.tasks.length }} tasks</span
      ><span
        ><Sparkles :size="13" aria-hidden="true" /> Progress, one task at a
        time.</span
      >
    </div>
  </section>
</template>
