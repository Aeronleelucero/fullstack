<script setup>
import { reactive, ref, nextTick } from 'vue'
import { Plus, AlignLeft, Check, CalendarDays } from '@lucide/vue'
import { CATEGORIES, PRIORITIES } from '../utils/taskSchema.js'
import { useTasksStore } from '../stores/tasks.js'
const props = defineProps({
  task: { type: Object, default: null },
  compact: Boolean,
})
const emit = defineEmits(['saved', 'cancel'])
const store = useTasksStore()
const blank = () => ({
  title: '',
  description: '',
  category: 'Work',
  priority: 'Medium',
  dueDate: '',
  completed: false,
})
const fields = reactive(props.task ? { ...props.task } : blank())
const errors = reactive({})
const formError = ref('')
const details = ref(!props.compact)
const form = ref(null)
const prefix = props.compact ? 'quick' : 'modal'
async function submit() {
  Object.keys(errors).forEach((key) => delete errors[key])
  formError.value = ''
  try {
    const dateControl = form.value.querySelector('[name="dueDate"]')
    if (dateControl?.validity.badInput) {
      errors.dueDate =
        'Complete the due date, or clear it to leave this task undated.'
      await nextTick()
      dateControl.focus()
      return
    }
    const id = props.task?.id
    if (id) store.updateTask(id, fields)
    else store.addTask(fields)
    emit('saved')
    if (props.compact) {
      Object.assign(fields, blank())
      details.value = false
      form.value.querySelector('[name="title"]')?.focus()
    }
  } catch (error) {
    if (error.errors) {
      Object.assign(errors, error.errors)
      await nextTick()
      form.value.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus()
    } else formError.value = error.message
  }
}
</script>
<template>
  <form
    ref="form"
    class="task-form"
    :class="{ 'quick-form': compact }"
    novalidate
    :aria-label="task ? 'Edit task details' : 'Create a task'"
    @submit.prevent="submit"
  >
    <div class="task-title-row">
      <div class="form-field title-field">
        <label :for="`${prefix}-title`" :class="{ 'sr-only': compact }"
          >Task title <span aria-hidden="true">*</span></label
        >
        <Plus v-if="compact" class="quick-plus" :size="20" aria-hidden="true" />
        <input
          :id="`${prefix}-title`"
          v-model="fields.title"
          name="title"
          type="text"
          placeholder="What would you like to work on?"
          autocomplete="off"
          maxlength="160"
          required
          :disabled="store.readOnly"
          :aria-invalid="!!errors.title"
          :aria-describedby="errors.title ? `${prefix}-title-error` : undefined"
          @input="delete errors.title"
        />
        <p
          v-if="errors.title"
          :id="`${prefix}-title-error`"
          class="field-error"
        >
          {{ errors.title }}
        </p>
      </div>
      <button
        v-if="compact"
        class="button button-primary quick-add"
        type="submit"
        :disabled="store.readOnly"
      >
        <Plus :size="17" aria-hidden="true" /> Add task
      </button>
    </div>
    <div v-if="details" class="form-field description-field">
      <label :for="`${prefix}-description`"
        >Description <span class="optional">optional</span></label
      ><textarea
        :id="`${prefix}-description`"
        v-model="fields.description"
        name="description"
        rows="3"
        maxlength="4000"
        placeholder="A little context for your future self…"
        :disabled="store.readOnly"
        :aria-invalid="!!errors.description"
        :aria-describedby="
          errors.description ? `${prefix}-description-error` : undefined
        "
      ></textarea>
      <p
        v-if="errors.description"
        :id="`${prefix}-description-error`"
        class="field-error"
      >
        {{ errors.description }}
      </p>
    </div>
    <div class="task-form-options">
      <div class="form-field">
        <label :for="`${prefix}-category`">Category</label>
        <div class="select-wrap">
          <select
            :id="`${prefix}-category`"
            v-model="fields.category"
            name="category"
            :disabled="store.readOnly"
          >
            <option v-for="category in CATEGORIES" :key="category">
              {{ category }}
            </option>
          </select>
        </div>
        <p v-if="errors.category" class="field-error">{{ errors.category }}</p>
      </div>
      <div class="form-field">
        <label :for="`${prefix}-priority`">Priority</label>
        <div class="select-wrap">
          <select
            :id="`${prefix}-priority`"
            v-model="fields.priority"
            name="priority"
            :disabled="store.readOnly"
          >
            <option v-for="priority in PRIORITIES" :key="priority">
              {{ priority }}
            </option>
          </select>
        </div>
        <p v-if="errors.priority" class="field-error">{{ errors.priority }}</p>
      </div>
      <div class="form-field">
        <label :for="`${prefix}-date`"
          ><CalendarDays :size="12" aria-hidden="true" /> Due date
          <span class="optional">optional</span></label
        ><input
          :id="`${prefix}-date`"
          v-model="fields.dueDate"
          name="dueDate"
          @input="delete errors.dueDate"
          type="date"
          min="0001-01-01"
          max="9999-12-31"
          :disabled="store.readOnly"
          :aria-invalid="!!errors.dueDate"
          :aria-describedby="
            errors.dueDate ? `${prefix}-date-error` : undefined
          "
        />
        <p
          v-if="errors.dueDate"
          :id="`${prefix}-date-error`"
          class="field-error"
        >
          {{ errors.dueDate }}
        </p>
      </div>
      <button
        v-if="compact"
        type="button"
        class="details-button"
        :aria-expanded="details"
        :disabled="store.readOnly"
        @click="details = !details"
      >
        <AlignLeft :size="15" aria-hidden="true" />
        {{ details ? 'Hide details' : 'Add details' }}
      </button>
    </div>
    <label v-if="!compact" class="completion-field"
      ><input
        v-model="fields.completed"
        type="checkbox"
        name="completed"
        :disabled="store.readOnly"
      /><span>Mark this task as completed</span></label
    >
    <p v-if="formError" class="field-error" role="alert">{{ formError }}</p>
    <div v-if="!compact" class="dialog-actions">
      <button
        type="button"
        class="button button-secondary"
        @click="emit('cancel')"
      >
        Cancel</button
      ><button
        type="submit"
        class="button button-primary"
        :disabled="store.readOnly"
      >
        <Check :size="17" aria-hidden="true" />
        {{ task ? 'Save changes' : 'Create task' }}
      </button>
    </div>
  </form>
</template>
