import { toCents } from '../utils/currency.js'
import { CATEGORIES } from '../utils/categories.js'
export class CatalogError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'CatalogError'
    this.code = code
  }
}
export function normalizeCatalog(raw) {
  if (!Array.isArray(raw) || raw.length > 1000)
    throw new CatalogError(
      'invalid-data',
      'The catalog returned an unsupported response. Please try again.',
    )
  const products = [],
    seen = new Set()
  for (const value of raw) {
    try {
      if (
        !value ||
        !Number.isSafeInteger(value.id) ||
        value.id < 1 ||
        seen.has(value.id) ||
        typeof value.title !== 'string' ||
        !value.title.trim() ||
        value.title.length > 1000 ||
        typeof value.description !== 'string' ||
        value.description.length > 20000 ||
        !CATEGORIES.some((category) => category.id === value.category)
      )
        throw new Error('Invalid product')
      if (
        !value.rating ||
        !Number.isFinite(value.rating.rate) ||
        value.rating.rate < 0 ||
        value.rating.rate > 5 ||
        !Number.isSafeInteger(value.rating.count) ||
        value.rating.count < 0
      )
        throw new Error('Invalid rating')
      let image = null
      try {
        const url = new URL(value.image)
        if (
          url.protocol === 'https:' &&
          ['fakestoreapi.com', 'www.fakestoreapi.com'].includes(url.hostname)
        )
          image = url.href
      } catch {}
      products.push({
        id: value.id,
        title: value.title.trim(),
        description: value.description,
        category: value.category,
        priceCents: toCents(value.price),
        image,
        rating: { rate: value.rating.rate, count: value.rating.count },
      })
      seen.add(value.id)
    } catch {
      /* Invalid records are counted and disclosed, never replaced with invented values. */
    }
  }
  if (raw.length && !products.length)
    throw new CatalogError(
      'invalid-data',
      'The catalog contained no valid product records. Please try again later.',
    )
  return { products, skipped: raw.length - products.length }
}
export async function fetchProducts({
  signal,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000,
} = {}) {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetchImpl('https://fakestoreapi.com/products', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (response.status === 429)
      throw new CatalogError(
        'rate-limit',
        'The catalog is receiving too many requests. Please wait a moment and try again.',
      )
    if (!response.ok)
      throw new CatalogError(
        'service',
        'The product catalog is temporarily unavailable. Your saved cart is unchanged. Please try again.',
      )
    let json
    try {
      json = await response.json()
    } catch {
      throw new CatalogError(
        'invalid-data',
        'The catalog returned unreadable data. Please try again.',
      )
    }
    return normalizeCatalog(json)
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    if (timedOut)
      throw new CatalogError(
        'timeout',
        'The catalog took too long to respond. Check your connection and try again.',
      )
    if (error instanceof CatalogError) throw error
    throw new CatalogError(
      'network',
      'We couldn’t reach the product catalog. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
