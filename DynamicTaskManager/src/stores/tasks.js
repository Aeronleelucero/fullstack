import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import {
  browserStorage,
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_KEY,
} from '../utils/storage.js'
import { CATEGORIES, validateTaskInput } from '../utils/taskSchema.js'
import { isOverdue, localDateKey, matchesDueFilter } from '../utils/dates.js'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const today = ref(localDateKey())
  const view = ref('overview')
  const filters = reactive({
    status: 'all',
    category: 'all',
    priority: 'all',
    due: 'all',
    search: '',
  })
  const persistenceState = ref('ready')
  const storageMessage = ref('')
  const originalRaw = ref(null)
  const unsaved = ref(false)
  const announcement = ref('')
  let storage = null
  const readOnly = computed(() =>
    ['corrupt', 'unavailable', 'conflict'].includes(persistenceState.value),
  )
  const orderedTasks = computed(() =>
    [...tasks.value].sort((a, b) => a.order - b.order),
  )
  const visibleTasks = computed(() => {
    const query = filters.search.trim().toLocaleLowerCase()
    return orderedTasks.value.filter(
      (task) =>
        (filters.status === 'all' ||
          (filters.status === 'completed'
            ? task.completed
            : !task.completed)) &&
        (filters.category === 'all' || task.category === filters.category) &&
        (filters.priority === 'all' || task.priority === filters.priority) &&
        matchesDueFilter(task, filters.due, today.value) &&
        (!query ||
          `${task.title}\n${task.description}`
            .toLocaleLowerCase()
            .includes(query)),
    )
  })
  const stats = computed(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter((task) => task.completed).length
    return {
      total,
      completed,
      active: total - completed,
      overdue: tasks.value.filter((task) => isOverdue(task, today.value))
        .length,
      today: tasks.value.filter(
        (task) => !task.completed && task.dueDate === today.value,
      ).length,
      upcoming: tasks.value.filter(
        (task) => !task.completed && task.dueDate && task.dueDate > today.value,
      ).length,
      percentage: total ? Math.round((completed / total) * 100) : 0,
    }
  })
  const categoryStats = computed(() =>
    CATEGORIES.map((name) => ({
      name,
      total: tasks.value.filter((task) => task.category === name).length,
      active: tasks.value.filter(
        (task) => task.category === name && !task.completed,
      ).length,
    })),
  )
  const hasFilters = computed(
    () =>
      filters.status !== 'all' ||
      filters.category !== 'all' ||
      filters.priority !== 'all' ||
      filters.due !== 'all' ||
      !!filters.search.trim(),
  )

  function initialize(target = browserStorage()) {
    storage = target
    const result = loadFromLocalStorage(storage)
    tasks.value = result.tasks.sort((a, b) => a.order - b.order)
    persistenceState.value = result.state
    storageMessage.value = result.message
    originalRaw.value = result.raw
    unsaved.value = false
  }
  function assertWritable() {
    if (readOnly.value)
      throw new Error(
        'Editing is paused to protect saved data. Review the storage notice first.',
      )
  }
  function persist() {
    const result = saveToLocalStorage(orderedTasks.value, {
      storage,
      expectedRaw: originalRaw.value,
    })
    persistenceState.value = result.state
    storageMessage.value = result.message
    if (result.ok) {
      originalRaw.value = result.raw
      unsaved.value = false
    } else unsaved.value = true
    return result.ok
  }
  function normalizeOrder() {
    tasks.value.forEach((task, index) => {
      task.order = index
    })
  }
  function addTask(input) {
    assertWritable()
    const fields = validateTaskInput(input)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    tasks.value = orderedTasks.value
    normalizeOrder()
    tasks.value.push({
      id,
      ...fields,
      createdAt: now,
      updatedAt: now,
      order: tasks.value.length,
    })
    persist()
    announcement.value = `Task added: ${fields.title}.`
    return id
  }
  function updateTask(id, input) {
    assertWritable()
    const task = tasks.value.find((task) => task.id === id)
    if (!task) throw new Error('This task is no longer available.')
    Object.assign(task, validateTaskInput(input), {
      updatedAt: new Date().toISOString(),
    })
    persist()
    announcement.value = `Task updated: ${task.title}.`
  }
  function toggleTask(id) {
    assertWritable()
    const task = tasks.value.find((task) => task.id === id)
    if (!task) throw new Error('This task is no longer available.')
    task.completed = !task.completed
    task.updatedAt = new Date().toISOString()
    persist()
    announcement.value = `${task.completed ? 'Completed' : 'Reopened'}: ${task.title}.`
  }
  function deleteTask(id) {
    assertWritable()
    const task = tasks.value.find((task) => task.id === id)
    if (!task) throw new Error('This task is no longer available.')
    tasks.value = orderedTasks.value.filter((task) => task.id !== id)
    normalizeOrder()
    persist()
    announcement.value = `Task deleted: ${task.title}.`
  }
  function reorderTask(id, targetId, placement = 'before') {
    assertWritable()
    if (!['before', 'after'].includes(placement)) return false
    const visible = visibleTasks.value.map((task) => task.id)
    if (id === targetId || !visible.includes(id) || !visible.includes(targetId))
      return false
    const nextIds = visible.filter((value) => value !== id)
    nextIds.splice(
      nextIds.indexOf(targetId) + (placement === 'after' ? 1 : 0),
      0,
      id,
    )
    if (nextIds.every((value, index) => value === visible[index])) return false
    const byId = new Map(tasks.value.map((task) => [task.id, task]))
    const visibleSet = new Set(visible)
    let cursor = 0
    tasks.value = orderedTasks.value.map((task) =>
      visibleSet.has(task.id) ? byId.get(nextIds[cursor++]) : task,
    )
    normalizeOrder()
    byId.get(id).updatedAt = new Date().toISOString()
    persist()
    announcement.value = `${byId.get(id).title} moved to position ${nextIds.indexOf(id) + 1} of ${nextIds.length} visible tasks.`
    return true
  }
  function moveTask(id, direction) {
    if (!['up', 'down'].includes(direction)) return false
    const ids = visibleTasks.value.map((task) => task.id)
    const index = ids.indexOf(id)
    const target = ids[index + (direction === 'up' ? -1 : 1)]
    return target
      ? reorderTask(id, target, direction === 'up' ? 'before' : 'after')
      : false
  }
  function setFilter(key, value) {
    if (!Object.hasOwn(filters, key) || typeof value !== 'string') return
    filters[key] = value
    view.value = 'all'
  }
  function resetFilters() {
    view.value = 'all'
    Object.assign(filters, {
      status: 'all',
      category: 'all',
      priority: 'all',
      due: 'all',
      search: '',
    })
  }
  function setView(next) {
    resetFilters()
    view.value = next
    if (next === 'today') {
      filters.due = 'today'
      filters.status = 'active'
    }
    if (next === 'upcoming') {
      filters.due = 'upcoming'
      filters.status = 'active'
    }
    if (next === 'completed') filters.status = 'completed'
    if (CATEGORIES.includes(next)) filters.category = next
  }
  function refreshToday(date = new Date()) {
    today.value = localDateKey(date)
  }
  function resetStorage() {
    const result = saveToLocalStorage([], {
      storage,
      expectedRaw: originalRaw.value,
    })
    persistenceState.value = result.state
    storageMessage.value = result.message
    if (!result.ok) return false
    tasks.value = []
    originalRaw.value = result.raw
    unsaved.value = false
    resetFilters()
    view.value = 'overview'
    announcement.value = 'Local task storage has been reset.'
    return true
  }
  function checkExternalStorage() {
    try {
      if (storage?.getItem(STORAGE_KEY) !== originalRaw.value) {
        persistenceState.value = 'conflict'
        storageMessage.value =
          'Task data changed in another tab. Your current view is preserved. Export it before reloading saved data.'
      }
    } catch {
      persistenceState.value = 'unavailable'
      storageMessage.value =
        'Browser storage cannot be read. Existing data is untouched; editing is paused.'
    }
  }
  function exportData(original = false) {
    return original && originalRaw.value !== null
      ? originalRaw.value
      : JSON.stringify(orderedTasks.value, null, 2)
  }
  function reloadStorage() {
    initialize(storage ?? browserStorage())
    announcement.value = 'Saved task data reloaded.'
  }
  return {
    tasks,
    today,
    view,
    filters,
    persistenceState,
    storageMessage,
    originalRaw,
    unsaved,
    announcement,
    readOnly,
    orderedTasks,
    visibleTasks,
    stats,
    categoryStats,
    hasFilters,
    initialize,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTask,
    moveTask,
    setFilter,
    resetFilters,
    setView,
    refreshToday,
    persist,
    resetStorage,
    checkExternalStorage,
    exportData,
    reloadStorage,
  }
})
