<script setup>
import {
  GripVertical,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Flag,
  CalendarDays,
} from '@lucide/vue'
import { isOverdue, formatDueDate } from '../utils/dates.js'
defineProps({
  task: { type: Object, required: true },
  today: String,
  first: Boolean,
  last: Boolean,
  readOnly: Boolean,
  dragging: Boolean,
})
const emit = defineEmits([
  'toggle',
  'edit',
  'delete',
  'move',
  'drag',
  'dragend',
  'drop-task',
])
function dragStart(event, id) {
  event.dataTransfer.setData('text/plain', id)
  event.dataTransfer.effectAllowed = 'move'
  emit('drag', id)
}
function drop(event, targetId) {
  const sourceId = event.dataTransfer.getData('text/plain')
  const bounds = event.currentTarget.getBoundingClientRect()
  emit('drop-task', {
    sourceId,
    targetId,
    placement:
      event.clientY > bounds.top + bounds.height / 2 ? 'after' : 'before',
  })
}
</script>
<template>
  <li
    class="task-card"
    :class="{ 'is-completed': task.completed, 'is-dragging': dragging }"
    :data-task-id="task.id"
    @dragover.prevent
    @drop.prevent="drop($event, task.id)"
  >
    <span
      class="drag-handle"
      :draggable="!readOnly"
      aria-hidden="true"
      @dragstart="dragStart($event, task.id)"
      @dragend="emit('dragend')"
      ><GripVertical :size="17" /></span
    ><label class="task-checkbox"
      ><input
        type="checkbox"
        :checked="task.completed"
        :disabled="readOnly"
        :aria-label="`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`"
        @change="emit('toggle', task.id)" /><span
        class="checkbox-drawing"
        aria-hidden="true"
      ></span
    ></label>
    <div class="task-body">
      <h3>{{ task.title }}</h3>
      <p v-if="task.description" class="task-description">
        {{ task.description }}
      </p>
      <div class="task-meta">
        <span class="category-badge" :class="task.category.toLowerCase()"
          ><i aria-hidden="true"></i>{{ task.category }}</span
        ><span class="priority-badge" :class="task.priority.toLowerCase()"
          ><Flag :size="12" aria-hidden="true" />{{ task.priority }}</span
        ><span
          class="due-badge"
          :class="{
            overdue: isOverdue(task, today),
            'due-today': !task.completed && task.dueDate === today,
          }"
          ><CalendarDays :size="13" aria-hidden="true" /><template
            v-if="task.dueDate"
            ><span v-if="isOverdue(task, today)">Overdue · </span
            ><span v-else-if="task.dueDate === today">Today · </span
            ><time :datetime="task.dueDate">{{
              formatDueDate(task.dueDate, today)
            }}</time></template
          ><span v-else>No due date</span></span
        >
      </div>
    </div>
    <div class="task-actions">
      <div class="reorder-actions">
        <button
          type="button"
          class="icon-button task-action"
          :disabled="first || readOnly"
          :aria-label="`Move ${task.title} up`"
          title="Move up"
          @click="emit('move', task.id, 'up')"
        >
          <ArrowUp :size="15" aria-hidden="true" /></button
        ><button
          type="button"
          class="icon-button task-action"
          :disabled="last || readOnly"
          :aria-label="`Move ${task.title} down`"
          title="Move down"
          @click="emit('move', task.id, 'down')"
        >
          <ArrowDown :size="15" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        class="icon-button task-action"
        :disabled="readOnly"
        :aria-label="`Edit ${task.title}`"
        title="Edit task"
        @click="emit('edit', task)"
      >
        <Pencil :size="16" aria-hidden="true" /></button
      ><button
        type="button"
        class="icon-button task-action delete-action"
        :disabled="readOnly"
        :aria-label="`Delete ${task.title}`"
        title="Delete task"
        @click="emit('delete', task)"
      >
        <Trash2 :size="16" aria-hidden="true" />
      </button>
    </div>
  </li>
</template>
