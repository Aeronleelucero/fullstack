export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const [year, month, day] = value.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return (
    year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
  )
}

export function isOverdue(task, today = localDateKey()) {
  return !task.completed && !!task.dueDate && task.dueDate < today
}

export function matchesDueFilter(task, filter, today = localDateKey()) {
  if (filter === 'today') return task.dueDate === today
  if (filter === 'upcoming') return !!task.dueDate && task.dueDate > today
  if (filter === 'overdue') return isOverdue(task, today)
  if (filter === 'none') return !task.dueDate
  return true
}

export function formatDueDate(value, today = localDateKey()) {
  if (!isValidDateKey(value)) return 'No due date'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(value.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
  }).format(date)
}
