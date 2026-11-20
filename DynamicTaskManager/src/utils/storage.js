import { isValidStoredTask } from './taskSchema.js'
export const STORAGE_KEY = 'productivity.tasks.v1'

export function browserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

export function loadFromLocalStorage(storage = browserStorage()) {
  let raw
  try {
    if (!storage) throw new Error('Storage unavailable')
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return {
      tasks: [],
      raw: null,
      state: 'unavailable',
      message:
        'Browser storage could not be read. Existing data has not been changed.',
    }
  }
  if (raw === null) return { tasks: [], raw, state: 'ready', message: '' }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      tasks: [],
      raw,
      state: 'corrupt',
      message:
        'Saved data contains unreadable JSON. Your original data is preserved; editing is paused.',
    }
  }
  if (!Array.isArray(parsed))
    return {
      tasks: [],
      raw,
      state: 'corrupt',
      message:
        'Saved data has an unsupported format. Your original data is preserved; editing is paused.',
    }
  const seen = new Set()
  const tasks = []
  for (const task of parsed) {
    if (!isValidStoredTask(task) || seen.has(task.id)) continue
    seen.add(task.id)
    tasks.push({ ...task })
  }
  if (tasks.length !== parsed.length) {
    return {
      tasks,
      raw,
      state: 'corrupt',
      message: `${parsed.length - tasks.length} saved record(s) could not be safely loaded. Readable tasks are shown; the original data is untouched and editing is paused.`,
    }
  }
  return { tasks, raw, state: 'ready', message: '' }
}

export function saveToLocalStorage(
  tasks,
  { storage = browserStorage(), expectedRaw } = {},
) {
  if (
    !Array.isArray(tasks) ||
    tasks.some((task) => !isValidStoredTask(task)) ||
    new Set(tasks.map((task) => task.id)).size !== tasks.length
  ) {
    return {
      ok: false,
      state: 'write-failed',
      message:
        'Invalid task data was not saved. The previous saved data is unchanged.',
    }
  }
  let current
  try {
    if (!storage) throw new Error('Storage unavailable')
    current = storage.getItem(STORAGE_KEY)
  } catch {
    return {
      ok: false,
      state: 'unavailable',
      message:
        'Browser storage is unavailable. Your latest changes are only in memory; export them before leaving.',
    }
  }
  if (expectedRaw !== undefined && current !== expectedRaw) {
    return {
      ok: false,
      state: 'conflict',
      message:
        'Saved data changed in another tab. Your current view is preserved, but saving is paused. Export it before reloading saved data.',
    }
  }
  if (expectedRaw === undefined && current !== null) {
    const existing = loadFromLocalStorage(storage)
    if (existing.state !== 'ready')
      return {
        ok: false,
        state: existing.state,
        message:
          'Existing saved data could not be validated and was not overwritten.',
      }
    if (existing.raw !== current)
      return {
        ok: false,
        state: 'conflict',
        message:
          'Saved data changed while preparing to save; it was not overwritten.',
      }
  }
  try {
    const raw = JSON.stringify(tasks)
    storage.setItem(STORAGE_KEY, raw)
    return { ok: true, state: 'ready', raw, message: '' }
  } catch {
    return {
      ok: false,
      state: 'write-failed',
      message:
        'Your latest changes could not be saved. They are still visible here. Retry saving or export a backup before leaving.',
    }
  }
}
