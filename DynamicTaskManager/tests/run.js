import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useTasksStore } from '../src/stores/tasks.js'
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_KEY,
} from '../src/utils/storage.js'
import {
  isValidDateKey,
  localDateKey,
  isOverdue,
  matchesDueFilter,
  formatDueDate,
} from '../src/utils/dates.js'
import {
  validateTaskInput,
  isValidStoredTask,
} from '../src/utils/taskSchema.js'

function memoryStorage(initial = null) {
  const map = new Map(initial === null ? [] : [[STORAGE_KEY, initial]])
  return {
    writes: 0,
    failRead: false,
    failWrite: false,
    getItem(key) {
      if (this.failRead) throw new Error('read denied')
      return map.get(key) ?? null
    },
    setItem(key, value) {
      if (this.failWrite) throw new Error('quota exceeded')
      this.writes++
      map.set(key, String(value))
    },
  }
}
const input = (title = 'Write the project brief', extra = {}) => ({
  title,
  description: '',
  category: 'Work',
  priority: 'Medium',
  dueDate: '',
  completed: false,
  ...extra,
})
const record = (id = 'saved-task', extra = {}) => ({
  id,
  ...input(),
  createdAt: '2026-11-18T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
  order: 0,
  ...extra,
})
function fresh(storage = memoryStorage()) {
  setActivePinia(createPinia())
  const store = useTasksStore()
  store.initialize(storage)
  store.refreshToday(new Date(2026, 10, 20, 12))
  return { store, storage }
}
const titles = (store) => store.orderedTasks.map((task) => task.title)
const visible = (store) => store.visibleTasks.map((task) => task.title)

test('empty storage starts honestly empty without writing anything', () => {
  const { store, storage } = fresh()
  assert.deepEqual(store.tasks, [])
  assert.equal(storage.writes, 0)
  assert.equal(store.readOnly, false)
  assert.equal(store.stats.percentage, 0)
})
test('create trims title, adds stable UUID/timestamps/default fields and immediately persists', () => {
  const { store, storage } = fresh()
  const id = store.addTask(input('  Draft project brief  '))
  assert.match(id, /^[0-9a-f-]{36}$/)
  assert.equal(store.tasks[0].title, 'Draft project brief')
  assert.equal(store.tasks[0].completed, false)
  assert.equal(store.tasks[0].order, 0)
  assert.ok(isValidStoredTask(store.tasks[0]))
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY))[0].id, id)
})
test('reject empty and whitespace titles without mutating or saving', () => {
  const { store, storage } = fresh()
  for (const title of ['', '   '])
    assert.throws(
      () => store.addTask(input(title)),
      (error) => !!error.errors.title,
    )
  assert.equal(store.tasks.length, 0)
  assert.equal(storage.writes, 0)
})
test('validate all editable fields and length limits', () => {
  for (const extra of [
    { title: 'a'.repeat(161) },
    { description: 'a'.repeat(4001) },
    { category: 'unknown' },
    { priority: 'Urgent' },
    { dueDate: '2026-02-30' },
    { completed: 'false' },
  ]) {
    assert.throws(() => validateTaskInput(input('Task', extra)))
  }
})
test('edit every task field while preserving identity, creation time, and unknown stored fields', () => {
  const storage = memoryStorage(
    JSON.stringify([
      record('kept-id', { futureNote: { text: 'Preserve me' } }),
    ]),
  )
  const { store } = fresh(storage)
  store.updateTask(
    'kept-id',
    input('Edited', {
      description: 'Full description',
      category: 'Study',
      priority: 'High',
      dueDate: '2026-11-25',
      completed: true,
    }),
  )
  const task = store.tasks[0]
  assert.equal(task.id, 'kept-id')
  assert.equal(task.createdAt, '2026-11-18T10:00:00.000Z')
  assert.deepEqual(task.futureNote, { text: 'Preserve me' })
  assert.deepEqual(
    [task.title, task.category, task.priority, task.dueDate, task.completed],
    ['Edited', 'Study', 'High', '2026-11-25', true],
  )
  assert.notEqual(task.updatedAt, '2026-11-18T10:00:00.000Z')
  assert.equal(
    JSON.parse(storage.getItem(STORAGE_KEY))[0].description,
    'Full description',
  )
})
test('invalid edit is atomic and leaves the prior record intact', () => {
  const { store, storage } = fresh()
  const id = store.addTask(input('Original'))
  const raw = storage.getItem(STORAGE_KEY)
  assert.throws(() =>
    store.updateTask(id, input('Changed', { priority: 'invalid' })),
  )
  assert.equal(store.tasks[0].title, 'Original')
  assert.equal(storage.getItem(STORAGE_KEY), raw)
})
test('delete removes exactly one identity and normalizes order', () => {
  const { store, storage } = fresh()
  const a = store.addTask(input('A'))
  const b = store.addTask(input('B'))
  const c = store.addTask(input('C'))
  store.deleteTask(b)
  assert.deepEqual(
    store.orderedTasks.map((t) => t.id),
    [a, c],
  )
  assert.deepEqual(
    store.orderedTasks.map((t) => t.order),
    [0, 1],
  )
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).length, 2)
})
test('complete and reopen persist immediately, update stats, and announce the action', () => {
  const { store, storage } = fresh()
  const id = store.addTask(input('Ship the feature'))
  store.toggleTask(id)
  assert.equal(store.tasks[0].completed, true)
  assert.equal(store.stats.completed, 1)
  assert.match(store.announcement, /Completed/)
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY))[0].completed, true)
  store.toggleTask(id)
  assert.equal(store.stats.active, 1)
  assert.match(store.announcement, /Reopened/)
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY))[0].completed, false)
})
test('all, active, and completed status filters use actual state', () => {
  const { store } = fresh()
  store.addTask(input('Active'))
  store.addTask(input('Done', { completed: true }))
  assert.deepEqual(visible(store), ['Active', 'Done'])
  store.filters.status = 'active'
  assert.deepEqual(visible(store), ['Active'])
  store.filters.status = 'completed'
  assert.deepEqual(visible(store), ['Done'])
})
test('each default category filters independently', () => {
  const { store } = fresh()
  for (const category of ['Work', 'Personal', 'Study'])
    store.addTask(input(category, { category }))
  for (const category of ['Work', 'Personal', 'Study']) {
    store.filters.category = category
    assert.deepEqual(visible(store), [category])
  }
})
test('search matches titles and descriptions case-insensitively and trims query whitespace', () => {
  const { store } = fresh()
  store.addTask(input('Design review'))
  store.addTask(
    input('Read notes', { description: 'Review ACCESSIBILITY findings' }),
  )
  store.filters.search = '  REVIEW  '
  assert.equal(store.visibleTasks.length, 2)
  store.filters.search = 'accessibility'
  assert.deepEqual(visible(store), ['Read notes'])
  store.filters.search = 'nothing matches'
  assert.deepEqual(visible(store), [])
})
test('status, category, priority, due date, and search combine using intersection', () => {
  const { store } = fresh()
  store.addTask(
    input('Target', {
      description: 'launch',
      priority: 'High',
      dueDate: '2026-11-20',
    }),
  )
  store.addTask(
    input('Completed launch', {
      priority: 'High',
      dueDate: '2026-11-20',
      completed: true,
    }),
  )
  store.addTask(
    input('Study launch', {
      category: 'Study',
      priority: 'High',
      dueDate: '2026-11-20',
    }),
  )
  store.addTask(input('Low launch', { priority: 'Low', dueDate: '2026-11-20' }))
  store.addTask(
    input('Future launch', { priority: 'High', dueDate: '2026-11-25' }),
  )
  Object.assign(store.filters, {
    status: 'active',
    category: 'Work',
    priority: 'High',
    due: 'today',
    search: 'launch',
  })
  assert.deepEqual(visible(store), ['Target'])
  assert.equal(store.stats.total, 5)
})
test('all due-date filters work and completed past tasks do not match overdue', () => {
  const { store } = fresh()
  for (const [title, dueDate, completed] of [
    ['Past', '2026-11-19', false],
    ['Today', '2026-11-20', false],
    ['Future', '2026-11-21', false],
    ['No date', '', false],
    ['Past done', '2026-11-18', true],
  ])
    store.addTask(input(title, { dueDate, completed }))
  for (const [due, expected] of [
    ['overdue', ['Past']],
    ['today', ['Today']],
    ['upcoming', ['Future']],
    ['none', ['No date']],
  ]) {
    store.filters.due = due
    assert.deepEqual(visible(store), expected)
  }
})
test('dashboard totals, active, completed, overdue, due today, upcoming, and rounded percentage are real', () => {
  const { store } = fresh()
  store.addTask(input('Late', { dueDate: '2026-11-19' }))
  store.addTask(input('Today', { dueDate: '2026-11-20' }))
  store.addTask(input('Next', { dueDate: '2026-11-21' }))
  store.addTask(input('Done late', { dueDate: '2026-11-19', completed: true }))
  assert.deepEqual(store.stats, {
    total: 4,
    active: 3,
    completed: 1,
    overdue: 1,
    today: 1,
    upcoming: 1,
    percentage: 25,
  })
  store.filters.search = 'no match'
  assert.equal(store.stats.total, 4)
})
test('reload restores all fields and saved order without writing during load', () => {
  const { store, storage } = fresh()
  const a = store.addTask(
    input('A', { description: 'Keep', dueDate: '2026-11-25' }),
  )
  const b = store.addTask(input('B'))
  store.reorderTask(b, a)
  const writes = storage.writes
  const { store: reloaded } = fresh(storage)
  assert.deepEqual(titles(reloaded), ['B', 'A'])
  assert.equal(reloaded.tasks[1].description, 'Keep')
  assert.equal(storage.writes, writes)
})
test('malformed JSON and unsupported formats remain byte-for-byte untouched and lock writes', () => {
  for (const raw of ['{broken', 'null', '{}', '"text"', '']) {
    const storage = memoryStorage(raw)
    const { store } = fresh(storage)
    assert.equal(store.readOnly, true)
    assert.throws(() => store.addTask(input('No overwrite')))
    assert.equal(storage.getItem(STORAGE_KEY), raw)
    assert.equal(storage.writes, 0)
  }
})
test('invalid records are flagged while valid records remain visible and original data remains intact', () => {
  const raw = JSON.stringify([record(), { id: 'bad', title: 'Incomplete' }])
  const storage = memoryStorage(raw)
  const { store } = fresh(storage)
  assert.equal(store.tasks.length, 1)
  assert.equal(store.readOnly, true)
  assert.match(store.storageMessage, /1 saved record/)
  assert.equal(store.exportData(true), raw)
  assert.equal(storage.getItem(STORAGE_KEY), raw)
})
test('duplicate identities cause protective read-only mode rather than destructive cleanup', () => {
  const raw = JSON.stringify([record(), record()])
  const { store, storage } = fresh(memoryStorage(raw))
  assert.equal(store.tasks.length, 1)
  assert.equal(store.readOnly, true)
  assert.equal(storage.getItem(STORAGE_KEY), raw)
})
test('invalid stored field types, order, timestamps, and impossible calendar dates are rejected', () => {
  for (const extra of [
    { id: '' },
    { order: -1 },
    { order: 1.5 },
    { completed: 0 },
    { createdAt: 'yesterday' },
    { updatedAt: '2026-02-30T10:00:00.000Z' },
    { dueDate: '2026-02-30' },
  ])
    assert.equal(isValidStoredTask(record('id', extra)), false)
})
test('storage read failures pause editing and never attempt a write', () => {
  const storage = memoryStorage(JSON.stringify([record()]))
  storage.failRead = true
  const { store } = fresh(storage)
  assert.equal(store.persistenceState, 'unavailable')
  assert.throws(() => store.addTask(input()))
  assert.equal(storage.writes, 0)
})
test('write failures preserve in-memory changes and older saved data, and retry actually saves', () => {
  const { store, storage } = fresh()
  store.addTask(input('Saved'))
  const previous = storage.getItem(STORAGE_KEY)
  storage.failWrite = true
  store.addTask(input('Not saved yet'))
  assert.equal(store.tasks.length, 2)
  assert.equal(store.unsaved, true)
  assert.equal(store.readOnly, false)
  assert.equal(storage.getItem(STORAGE_KEY), previous)
  assert.equal(JSON.parse(store.exportData()).length, 2)
  storage.failWrite = false
  assert.equal(store.persist(), true)
  assert.equal(store.unsaved, false)
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).length, 2)
})
test('another-tab changes are not overwritten by a stale save', () => {
  const { store, storage } = fresh()
  store.addTask(input('Original'))
  const other = JSON.stringify([record('other', { title: 'Another tab' })])
  storage.setItem(STORAGE_KEY, other)
  store.addTask(input('Keep my unsaved work'))
  assert.equal(store.persistenceState, 'conflict')
  assert.equal(store.readOnly, true)
  assert.equal(store.tasks.length, 2)
  assert.equal(storage.getItem(STORAGE_KEY), other)
})
test('external change notification pauses writes and explicit reload reads the current snapshot', () => {
  const { store, storage } = fresh()
  store.addTask(input('Old view'))
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify([record('new', { title: 'New view' })]),
  )
  store.checkExternalStorage()
  assert.equal(store.readOnly, true)
  store.reloadStorage()
  assert.equal(store.readOnly, false)
  assert.deepEqual(titles(store), ['New view'])
})
test('storage helpers refuse invalid outgoing data and do not overwrite unreadable data implicitly', () => {
  const storage = memoryStorage('{broken')
  assert.equal(saveToLocalStorage([{}], { storage }).ok, false)
  assert.equal(saveToLocalStorage([], { storage }).ok, false)
  assert.equal(storage.getItem(STORAGE_KEY), '{broken')
})
test('explicit recovery reset writes an empty list only if the original snapshot still matches', () => {
  const { store, storage } = fresh(memoryStorage('{broken'))
  assert.equal(store.resetStorage(), true)
  assert.equal(store.readOnly, false)
  assert.equal(storage.getItem(STORAGE_KEY), '[]')
  store.addTask(input('Recovered'))
  assert.equal(store.tasks.length, 1)
})
test('reorder preserves identities, fields, uniqueness, persisted order, and task count', () => {
  const { store, storage } = fresh()
  const a = store.addTask(input('A'))
  const b = store.addTask(input('B'))
  const c = store.addTask(input('C'))
  assert.equal(store.reorderTask(c, a, 'before'), true)
  assert.deepEqual(titles(store), ['C', 'A', 'B'])
  assert.deepEqual(new Set(store.tasks.map((t) => t.id)), new Set([a, b, c]))
  assert.equal(store.tasks.length, 3)
  assert.deepEqual(
    JSON.parse(storage.getItem(STORAGE_KEY)).map((t) => t.title),
    ['C', 'A', 'B'],
  )
})
test('filtered reorder changes visible slots only and retains hidden-task positions', () => {
  const { store } = fresh()
  const hiddenA = store.addTask(input('Hidden A', { category: 'Personal' }))
  const a = store.addTask(input('Work A'))
  const hiddenB = store.addTask(input('Hidden B', { category: 'Study' }))
  const b = store.addTask(input('Work B'))
  const c = store.addTask(input('Work C'))
  store.filters.category = 'Work'
  store.reorderTask(c, a, 'before')
  assert.deepEqual(titles(store), [
    'Hidden A',
    'Work C',
    'Hidden B',
    'Work A',
    'Work B',
  ])
  assert.equal(store.tasks[0].id, hiddenA)
  assert.equal(store.tasks[2].id, hiddenB)
  assert.equal(store.reorderTask(hiddenA, b), false)
})
test('keyboard/manual moves respect visible boundaries and persist', () => {
  const { store } = fresh()
  const a = store.addTask(input('A'))
  const b = store.addTask(input('B'))
  assert.equal(store.moveTask(a, 'up'), false)
  assert.equal(store.moveTask(b, 'down'), false)
  assert.equal(store.moveTask(b, 'up'), true)
  assert.deepEqual(titles(store), ['B', 'A'])
  assert.equal(store.moveTask(b, 'down'), true)
  assert.deepEqual(titles(store), ['A', 'B'])
})
test('invalid, identical, or filtered-out drag targets cannot duplicate or reorder records', () => {
  const { store } = fresh()
  const id = store.addTask(input('A'))
  const raw = store.exportData()
  assert.equal(store.reorderTask(id, id), false)
  assert.equal(store.reorderTask('external', id), false)
  assert.equal(store.reorderTask(id, 'external'), false)
  assert.equal(store.exportData(), raw)
})
test('sidebar views map to real combined filters and reset stale search filters', () => {
  const { store } = fresh()
  store.addTask(input('Due now', { dueDate: '2026-11-20' }))
  store.addTask(input('Study', { category: 'Study' }))
  store.filters.search = 'nothing'
  store.setView('today')
  assert.deepEqual(visible(store), ['Due now'])
  assert.equal(store.filters.status, 'active')
  store.setView('Study')
  assert.deepEqual(visible(store), ['Study'])
  store.setView('all')
  assert.equal(store.visibleTasks.length, 2)
})
test('calendar validation handles leap years and month boundaries', () => {
  for (const value of ['2024-02-29', '2000-02-29', '2026-11-30'])
    assert.equal(isValidDateKey(value), true)
  for (const value of [
    '2026-02-29',
    '1900-02-29',
    '2026-11-31',
    '2026-00-10',
    '2026-13-01',
    '2026-1-01',
    '2026-11-20T00:00:00Z',
  ])
    assert.equal(isValidDateKey(value), false)
})
test('local calendar keys use local dates on both sides of UTC midnight', () => {
  const before = process.env.TZ
  try {
    process.env.TZ = 'America/Los_Angeles'
    assert.equal(localDateKey(new Date('2026-11-20T00:30:00Z')), '2026-11-19')
    process.env.TZ = 'Asia/Manila'
    assert.equal(localDateKey(new Date('2026-11-19T23:30:00Z')), '2026-11-20')
  } finally {
    if (before === undefined) delete process.env.TZ
    else process.env.TZ = before
  }
})
test('due comparisons are calendar-based and completed tasks never count as overdue', () => {
  const task = record('due', { dueDate: '2026-11-19' })
  assert.equal(isOverdue(task, '2026-11-20'), true)
  assert.equal(isOverdue({ ...task, completed: true }, '2026-11-20'), false)
  assert.equal(
    matchesDueFilter({ ...task, dueDate: '2026-11-20' }, 'today', '2026-11-20'),
    true,
  )
  assert.match(formatDueDate('2026-11-25', '2026-11-20'), /25/)
})
test('crossing local midnight updates due-based statistics without mutating persisted task data', () => {
  const { store, storage } = fresh()
  store.addTask(input('Due today', { dueDate: '2026-11-20' }))
  const raw = storage.getItem(STORAGE_KEY)
  assert.equal(store.stats.today, 1)
  store.refreshToday(new Date(2026, 10, 21, 0, 1))
  assert.equal(store.stats.overdue, 1)
  assert.equal(store.stats.today, 0)
  assert.equal(storage.getItem(STORAGE_KEY), raw)
})

test('storage can be reacquired after initial getter access was unavailable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  try {
    const { store } = fresh(null)
    assert.equal(store.readOnly, true)
    const available = memoryStorage(
      JSON.stringify([record('restored', { title: 'Permission restored' })]),
    )
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: available,
    })
    store.reloadStorage()
    assert.equal(store.readOnly, false)
    assert.deepEqual(titles(store), ['Permission restored'])
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  }
})
test('a recovery reset cannot overwrite new valid data written after a corrupt snapshot', () => {
  const { store, storage } = fresh(memoryStorage('{broken'))
  const newData = JSON.stringify([record('other', { title: 'New valid data' })])
  storage.setItem(STORAGE_KEY, newData)
  assert.equal(store.resetStorage(), false)
  assert.equal(storage.getItem(STORAGE_KEY), newData)
  assert.equal(store.persistenceState, 'conflict')
})
test('manual filters and clearing filters cannot leave a mismatched shortcut highlighted', () => {
  const { store } = fresh()
  store.setView('Work')
  store.setFilter('category', 'Personal')
  assert.equal(store.view, 'all')
  assert.equal(store.filters.category, 'Personal')
  store.setView('today')
  store.resetFilters()
  assert.equal(store.view, 'all')
  assert.equal(store.filters.due, 'all')
})
