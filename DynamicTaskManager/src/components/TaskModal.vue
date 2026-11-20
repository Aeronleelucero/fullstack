<script setup>
import { ListTodo } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
import TaskForm from './TaskForm.vue'
defineProps({ task: { type: Object, default: null } })
defineEmits(['close'])
</script>
<template>
  <BaseDialog
    labelledby="task-modal-title"
    initial-focus="[name='title']"
    @close="$emit('close')"
    ><div class="dialog-heading">
      <span class="dialog-symbol"
        ><ListTodo :size="23" aria-hidden="true"
      /></span>
      <p class="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
      <h2 id="task-modal-title">
        {{ task ? 'Edit your task' : 'Make a little progress.' }}
      </h2>
      <p>
        {{
          task
            ? 'Update the details and keep your plan moving.'
            : 'Big ideas start with one small, actionable task.'
        }}
      </p>
    </div>
    <TaskForm :task="task" @saved="$emit('close')" @cancel="$emit('close')"
  /></BaseDialog>
</template>
