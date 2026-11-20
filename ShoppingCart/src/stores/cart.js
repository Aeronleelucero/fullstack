import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useProductsStore } from './products.js'
import {
  browserStorage,
  loadCart,
  saveCart,
  CART_KEY,
} from '../utils/storage.js'
import {
  calculatePricing,
  validQuantity,
  MAX_QUANTITY,
} from '../utils/pricing.js'
export const useCartStore = defineStore('cart', () => {
  const catalog = useProductsStore(),
    entries = ref([]),
    persistenceState = ref('ready'),
    message = ref(''),
    unsaved = ref(false),
    originalRaw = ref(null),
    announcement = ref(''),
    lastOrder = shallowRef(null)
  let storage = null
  const readOnly = computed(() =>
    ['corrupt', 'unavailable', 'conflict'].includes(persistenceState.value),
  )
  const quantity = computed(() =>
    entries.value.reduce((sum, entry) => sum + entry.quantity, 0),
  )
  const items = computed(() =>
    entries.value.flatMap((entry) => {
      const product = catalog.byId.get(entry.id)
      return product
        ? [
            {
              ...product,
              quantity: entry.quantity,
              lineTotalCents: product.priceCents * entry.quantity,
            },
          ]
        : []
    }),
  )
  const missing = computed(() =>
    catalog.ready
      ? entries.value.filter((entry) => !catalog.byId.has(entry.id))
      : [],
  )
  const totals = computed(() => calculatePricing(items.value))
  const canCheckout = computed(
    () =>
      catalog.ready &&
      !readOnly.value &&
      items.value.length > 0 &&
      missing.value.length === 0,
  )
  function initialize(target = browserStorage()) {
    storage = target
    const result = loadCart(storage)
    entries.value = result.entries
    persistenceState.value = result.state
    message.value = result.message
    originalRaw.value = result.raw
    unsaved.value = false
  }
  function assertWritable() {
    if (readOnly.value)
      throw new Error(
        'Cart editing is paused. Review the saved-cart notice first.',
      )
  }
  function save(next = entries.value) {
    const result = saveCart(next, storage, originalRaw.value)
    persistenceState.value = result.state
    message.value = result.message
    if (result.ok) {
      originalRaw.value = result.raw
      unsaved.value = false
    } else unsaved.value = true
    return result.ok
  }
  function quantityFor(id) {
    return entries.value.find((entry) => entry.id === id)?.quantity || 0
  }
  function addToCart(product, count = 1) {
    assertWritable()
    const current = catalog.byId.get(product?.id)
    if (!catalog.ready || !current)
      throw new Error('This product is not available in the loaded catalog.')
    const total = quantityFor(current.id) + count
    if (!validQuantity(count) || !validQuantity(total))
      throw new Error(
        `This demo allows 1–${MAX_QUANTITY} of each product. This is an application limit, not a stock claim.`,
      )
    const found = entries.value.find((entry) => entry.id === current.id)
    if (found) found.quantity = total
    else entries.value.push({ id: current.id, quantity: count })
    save()
    announcement.value = `Added ${count} × ${current.title} to your cart.`
  }
  function updateQuantity(id, count) {
    assertWritable()
    if (!validQuantity(count))
      throw new Error(
        `Quantity must be between 1 and ${MAX_QUANTITY}. Use Remove to remove an item.`,
      )
    const entry = entries.value.find((entry) => entry.id === id)
    if (!entry) throw new Error('This item is no longer in the cart.')
    entry.quantity = count
    save()
    announcement.value = `Quantity updated to ${count}.`
  }
  function removeFromCart(id) {
    assertWritable()
    const index = entries.value.findIndex((entry) => entry.id === id)
    if (index < 0) return false
    entries.value.splice(index, 1)
    save()
    announcement.value = 'Item removed from your cart.'
    return true
  }
  function calculateTotal() {
    return totals.value.totalCents
  }
  function reload() {
    initialize(storage ?? browserStorage())
    announcement.value = 'Saved cart reloaded.'
  }
  function resetStorage() {
    if (!save([])) return false
    entries.value = []
    announcement.value = 'Saved cart reset.'
    return true
  }
  function checkExternalStorage() {
    try {
      if (storage?.getItem(CART_KEY) !== originalRaw.value) {
        persistenceState.value = 'conflict'
        message.value =
          'Your saved cart changed in another tab. This view is preserved; reload the saved cart before editing.'
      }
    } catch {
      persistenceState.value = 'unavailable'
      message.value =
        'Saved cart access is unavailable. Editing is paused to protect existing data.'
    }
  }
  function confirmCheckout({
    uuid = () => crypto.randomUUID(),
    now = () => new Date().toISOString(),
  } = {}) {
    assertWritable()
    if (!canCheckout.value)
      throw new Error(
        'Load the catalog and remove unavailable items before confirming a demo order.',
      )
    const order = {
      reference: `NX-${uuid().slice(0, 8).toUpperCase()}`,
      createdAt: now(),
      demo: true,
      items: items.value.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        priceCents: item.priceCents,
        lineTotalCents: item.lineTotalCents,
      })),
      totals: { ...totals.value },
    }
    if (!save([]))
      throw new Error(
        'The saved cart could not be cleared. No demo order was confirmed, and your current cart is unchanged. Review the storage notice and try again.',
      )
    entries.value = []
    lastOrder.value = order
    announcement.value =
      'Demo order confirmed locally. No payment was taken and no real order was submitted.'
    return order
  }
  function exportData(original = false) {
    return original && originalRaw.value !== null
      ? originalRaw.value
      : JSON.stringify(
          entries.value.map(({ id, quantity }) => ({ id, quantity })),
          null,
          2,
        )
  }
  return {
    entries,
    persistenceState,
    message,
    unsaved,
    readOnly,
    originalRaw,
    quantity,
    items,
    missing,
    totals,
    canCheckout,
    announcement,
    lastOrder,
    initialize,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    quantityFor,
    save,
    reload,
    resetStorage,
    checkExternalStorage,
    confirmCheckout,
    exportData,
  }
})
