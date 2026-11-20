import { validQuantity } from './pricing.js'
export const CART_KEY = 'nexora.cart.v1'
export function browserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}
export function validEntry(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    Number.isSafeInteger(entry.id) &&
    entry.id > 0 &&
    validQuantity(entry.quantity)
  )
}
export function loadCart(storage = browserStorage()) {
  let raw
  try {
    if (!storage) throw new Error()
    raw = storage.getItem(CART_KEY)
  } catch {
    return {
      entries: [],
      raw: null,
      state: 'unavailable',
      message:
        'Saved cart access is unavailable. Editing is paused to protect any existing cart. You can still browse the catalog.',
    }
  }
  if (raw === null) return { entries: [], raw, state: 'ready', message: '' }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length > 1000) throw new Error()
    const seen = new Set(),
      entries = []
    for (const entry of parsed) {
      if (!validEntry(entry) || seen.has(entry.id)) throw new Error()
      seen.add(entry.id)
      entries.push({ id: entry.id, quantity: entry.quantity })
    }
    return { entries, raw, state: 'ready', message: '' }
  } catch {
    return {
      entries: [],
      raw,
      state: 'corrupt',
      message:
        'Your saved cart could not be safely read. The original data is untouched. Download it before choosing to reset.',
    }
  }
}
export function saveCart(entries, storage, expectedRaw) {
  if (
    !Array.isArray(entries) ||
    entries.length > 1000 ||
    !entries.every(validEntry) ||
    new Set(entries.map((entry) => entry.id)).size !== entries.length
  )
    return {
      ok: false,
      state: 'write-failed',
      message: 'Invalid cart data was not saved.',
    }
  try {
    if (!storage) throw new Error()
    if (storage.getItem(CART_KEY) !== expectedRaw)
      return {
        ok: false,
        state: 'conflict',
        message:
          'Your saved cart changed in another tab. This view is preserved; reload the saved cart before editing.',
      }
    const raw = JSON.stringify(
      entries.map(({ id, quantity }) => ({ id, quantity })),
    )
    storage.setItem(CART_KEY, raw)
    return { ok: true, raw, state: 'ready', message: '' }
  } catch {
    return {
      ok: false,
      state: 'write-failed',
      message:
        'Changes are only in memory because this cart could not be saved. Retry saving or export a backup before leaving.',
    }
  }
}
export function downloadJSON(raw, filename) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: 'application/json;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
