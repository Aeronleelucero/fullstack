import { isValidDateKey } from './dates.js'
export const CATEGORIES = ['Work', 'Personal', 'Study']
export const PRIORITIES = ['Low', 'Medium', 'High']

export class TaskValidationError extends Error {
  constructor(errors) {
    super('Please check the task details.')
    this.name = 'TaskValidationError'
    this.errors = errors
  }
}

export function validateTaskInput(input) {
  const errors = {}
  if (typeof input?.title !== 'string' || !input.title.trim())
    errors.title = 'Give your task a title.'
  else if (input.title.trim().length > 160)
    errors.title = 'Keep the title to 160 characters or fewer.'
  if (typeof input?.description !== 'string' || input.description.length > 4000)
    errors.description = 'Use a description of 4,000 characters or fewer.'
  if (!CATEGORIES.includes(input?.category))
    errors.category = 'Choose a category.'
  if (!PRIORITIES.includes(input?.priority))
    errors.priority = 'Choose a priority.'
  if (input?.dueDate !== '' && !isValidDateKey(input?.dueDate))
    errors.dueDate = 'Choose a valid calendar date.'
  if (typeof input?.completed !== 'boolean')
    errors.completed = 'Choose an active or completed status.'
  if (Object.keys(errors).length) throw new TaskValidationError(errors)
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority,
    dueDate: input.dueDate,
    completed: input.completed,
  }
}

export function isValidStoredTask(task) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) return false
  if (typeof task.id !== 'string' || !task.id.trim() || task.id.length > 100)
    return false
  try {
    validateTaskInput(task)
  } catch {
    return false
  }
  if (!Number.isInteger(task.order) || task.order < 0) return false
  for (const key of ['createdAt', 'updatedAt']) {
    if (
      typeof task[key] !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T/.test(task[key]) ||
      !isValidDateKey(task[key].slice(0, 10)) ||
      !Number.isFinite(Date.parse(task[key]))
    )
      return false
  }
  return true
}
