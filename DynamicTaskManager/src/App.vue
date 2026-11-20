<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  Plus,
  TriangleAlert,
  Download,
  RotateCcw,
  LockKeyhole,
  Sparkles,
} from '@lucide/vue'
import { useTasksStore } from './stores/tasks.js'
import { STORAGE_KEY } from './utils/storage.js'
import { downloadJSON } from './utils/download.js'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import DashboardStats from './components/DashboardStats.vue'
import TaskForm from './components/TaskForm.vue'
import TaskList from './components/TaskList.vue'
import ProgressOverview from './components/ProgressOverview.vue'
import TaskModal from './components/TaskModal.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
const store = useTasksStore()
store.initialize()
const menuOpen = ref(false)
const modalOpen = ref(false)
const editingTask = ref(null)
const confirmation = ref(null)
const actionError = ref('')
const exportError = ref('')
let timer
const heroTitle = computed(
  () =>
    ({
      overview: 'A little progress, every day.',
      all: 'Your plans, in one place.',
      today: 'Make today a good one.',
      upcoming: 'A little room to plan ahead.',
      completed: 'Look at you, making progress.',
    })[store.view] || `${store.view}, with a little more focus.`,
)
function openTask(task = null) {
  editingTask.value = task
  modalOpen.value = true
}
function requestDelete(task) {
  actionError.value = ''
  confirmation.value = {
    type: 'delete',
    id: task.id,
    title: 'Delete this task?',
    description: `“${task.title}” will be permanently removed from your workspace. This action can’t be undone.`,
    label: 'Delete task',
  }
}
function requestReset() {
  actionError.value = ''
  confirmation.value = {
    type: 'reset',
    title: 'Reset local task storage?',
    description:
      'This permanently replaces this app’s saved tasks with an empty list. Download your original data first if you want to keep it.',
    label: 'Reset local data',
  }
}
function requestReload() {
  actionError.value = ''
  confirmation.value = {
    type: 'reload',
    title: 'Reload saved task data?',
    description:
      'Your current view and any unsaved changes will be replaced by the data currently saved in this browser. Export this view first if you want to keep it.',
    label: 'Reload saved data',
  }
}
async function confirmAction() {
  try {
    if (confirmation.value.type === 'delete')
      store.deleteTask(confirmation.value.id)
    else if (confirmation.value.type === 'reset') {
      if (!store.resetStorage()) {
        actionError.value = store.storageMessage
        return
      }
    } else store.reloadStorage()
    confirmation.value = null
    await nextTick()
    document.getElementById('tasks-heading')?.focus({ preventScroll: true })
  } catch (error) {
    actionError.value = error.message
  }
}
function exportTasks(original = false) {
  try {
    downloadJSON(
      store.exportData(original),
      original
        ? 'momentum-original-storage.json'
        : `momentum-tasks-${store.today}.json`,
    )
    store.announcement = original
      ? 'Original stored data download prepared.'
      : 'Task backup download prepared.'
    exportError.value = ''
  } catch {
    exportError.value =
      'A backup could not be downloaded. Browser download access may be restricted.'
  }
}
function storageChanged(event) {
  if (event.key === STORAGE_KEY || event.key === null)
    store.checkExternalStorage()
}
function refreshDate() {
  store.refreshToday()
}
onMounted(() => {
  timer = setInterval(refreshDate, 60000)
  window.addEventListener('storage', storageChanged)
  document.addEventListener('visibilitychange', refreshDate)
})
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('storage', storageChanged)
  document.removeEventListener('visibilitychange', refreshDate)
})
</script>
<template>
  <a href="#main-content" class="skip-link">Skip to tasks</a
  ><AppSidebar
    :open="menuOpen"
    @close="menuOpen = false"
    @export="exportTasks()"
  />
  <div class="app-shell">
    <AppHeader :menu-open="menuOpen" @menu="menuOpen = true" />
    <main id="main-content" tabindex="-1" class="main-content">
      <section class="welcome-section" aria-label="Workspace overview">
        <div>
          <p class="eyebrow">
            <span class="eyebrow-line"></span> YOUR PERSONAL WORKSPACE
          </p>
          <h1>{{ heroTitle }}</h1>
          <p class="welcome-description">
            A clear head starts with a clear plan. What’s on yours today?
          </p>
        </div>
        <button
          type="button"
          class="button button-primary new-task-button"
          :disabled="store.readOnly"
          @click="openTask()"
        >
          <Plus :size="18" aria-hidden="true" /> New task
        </button>
      </section>
      <div v-if="store.storageMessage" class="storage-notice" role="alert">
        <TriangleAlert :size="21" aria-hidden="true" />
        <div>
          <strong>{{
            store.readOnly
              ? 'Your saved data needs attention'
              : 'Your latest changes are not saved yet'
          }}</strong>
          <p>{{ store.storageMessage }}</p>
          <div class="notice-actions">
            <button
              v-if="store.persistenceState === 'write-failed'"
              type="button"
              @click="store.persist"
            >
              <RotateCcw :size="14" aria-hidden="true" /> Retry saving</button
            ><button type="button" @click="exportTasks()">
              <Download :size="14" aria-hidden="true" /> Export this view</button
            ><button
              v-if="
                store.originalRaw !== null &&
                store.persistenceState === 'corrupt'
              "
              type="button"
              @click="exportTasks(true)"
            >
              Download original data</button
            ><button type="button" @click="requestReload">
              Reload saved data</button
            ><button
              v-if="store.persistenceState === 'corrupt'"
              type="button"
              @click="requestReset"
            >
              Reset local data
            </button>
          </div>
        </div>
      </div>
      <p v-if="exportError" class="action-error" role="alert">
        {{ exportError }}
      </p>
      <DashboardStats />
      <div class="workspace-grid">
        <div class="tasks-column">
          <section
            class="quick-add-panel panel"
            aria-label="Quick task creation"
          >
            <div class="quick-add-heading">
              <span class="accent"
                ><Sparkles :size="16" aria-hidden="true"
              /></span>
              <h2>What’s your next step?</h2>
              <span class="small-label">Let’s get it on the list.</span>
            </div>
            <TaskForm compact />
          </section>
          <TaskList
            @edit="openTask"
            @delete="requestDelete"
            @new-task="openTask()"
            @error="exportError = $event"
          />
        </div>
        <ProgressOverview />
      </div>
      <footer class="workspace-footer">
        <span
          ><LockKeyhole :size="13" aria-hidden="true" /> No accounts. No cloud.
          Just your momentum.</span
        ><span>Made for a little more focus.</span>
      </footer>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ store.announcement }}
      </p>
    </main>
  </div>
  <TaskModal
    v-if="modalOpen"
    :task="editingTask"
    @close="modalOpen = false"
  /><ConfirmDialog
    v-if="confirmation"
    :title="confirmation.title"
    :description="confirmation.description"
    :confirm-label="confirmation.label"
    :error="actionError"
    @confirm="confirmAction"
    @close="confirmation = null"
  />
</template>
