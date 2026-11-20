import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'
import { fetchProducts, normalizeCatalog } from '../src/services/productApi.js'
import { useProductsStore } from '../src/stores/products.js'
import { useCartStore } from '../src/stores/cart.js'
import { toCents, formatMoney } from '../src/utils/currency.js'
import { calculatePricing } from '../src/utils/pricing.js'
import { loadCart, saveCart, CART_KEY } from '../src/utils/storage.js'
import { categoryLabel } from '../src/utils/categories.js'
import { rawProducts, memoryStorage, deferred } from './fixtures.js'
function setup(raw = null) {
  setActivePinia(createPinia())
  const catalog = useProductsStore()
  catalog.products = normalizeCatalog(rawProducts).products
  catalog.status = 'ready'
  const cart = useCartStore(),
    storage = memoryStorage(raw)
  cart.initialize(storage)
  return { catalog, cart, storage }
}
const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  })

test('fetches the actual documented endpoint and normalizes catalog fields', async () => {
  let url
  const result = await fetchProducts({
    fetchImpl: async (request) => {
      url = request
      return json(rawProducts)
    },
  })
  assert.equal(url, 'https://fakestoreapi.com/products')
  assert.equal(result.products.length, 4)
  assert.equal(result.products[0].priceCents, 1999)
  assert.equal(result.products[2].rating.rate, 4.8)
})
test('network, service, and rate-limit failures remain honest errors', async () => {
  await assert.rejects(
    fetchProducts({
      fetchImpl: async () => {
        throw new Error('offline')
      },
    }),
    (error) => error.code === 'network',
  )
  for (const status of [403, 500, 503, 429])
    await assert.rejects(
      fetchProducts({ fetchImpl: async () => new Response('', { status }) }),
      (error) => error.code === (status === 429 ? 'rate-limit' : 'service'),
    )
})
test('malformed JSON and unsupported top-level data are rejected', async () => {
  await assert.rejects(
    fetchProducts({ fetchImpl: async () => new Response('{bad') }),
    (error) => error.code === 'invalid-data',
  )
  for (const data of [null, {}, 'invalid'])
    assert.throws(() => normalizeCatalog(data))
})
test('empty catalog is real emptiness and invalid records are disclosed', () => {
  assert.deepEqual(normalizeCatalog([]), { products: [], skipped: 0 })
  const result = normalizeCatalog([
    ...rawProducts,
    { ...rawProducts[0], id: 6, price: -1 },
    rawProducts[0],
  ])
  assert.equal(result.products.length, 4)
  assert.equal(result.skipped, 2)
})
test('ratings and categories are validated rather than fabricated', () => {
  for (const change of [
    { rating: null },
    { rating: { rate: 6, count: 2 } },
    { rating: { rate: 3, count: -1 } },
    { category: 'invented' },
  ])
    assert.throws(() => normalizeCatalog([{ ...rawProducts[0], ...change }]))
})
test('unsafe or invalid images become explicit fallbacks without rejecting real product data', () => {
  for (const image of [
    'javascript:alert(1)',
    'http://example.test/photo',
    'https://untrusted.test/image',
    null,
  ])
    assert.equal(
      normalizeCatalog([{ ...rawProducts[0], image }]).products[0].image,
      null,
    )
})
test('timeout and external cancellation use different error states', async () => {
  await assert.rejects(
    fetchProducts({
      timeoutMs: 5,
      fetchImpl: (url, { signal }) =>
        new Promise((resolve, reject) =>
          signal.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
    }),
    (error) => error.code === 'timeout',
  )
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    fetchProducts({ signal: controller.signal }),
    (error) => error.name === 'AbortError',
  )
})
test('product store exposes loading, successful records and API failures', async () => {
  const { catalog } = setup()
  const pending = deferred()
  const run = catalog.load(() => pending.promise)
  assert.equal(catalog.status, 'loading')
  pending.resolve(normalizeCatalog(rawProducts))
  await run
  assert.equal(catalog.ready, true)
  await catalog.load(async () => {
    throw new Error('Failure')
  })
  assert.equal(catalog.status, 'error')
  assert.equal(catalog.products.length, 0)
})
test('late catalog responses cannot replace a newer load', async () => {
  const { catalog } = setup(),
    pending = deferred()
  const first = catalog.load(() => pending.promise)
  await catalog.load(async () => normalizeCatalog([rawProducts[1]]))
  pending.resolve(normalizeCatalog(rawProducts))
  await first
  assert.equal(catalog.products.length, 1)
  assert.equal(catalog.products[0].id, 2)
})
test('search matches title, description and exact category, case-insensitively', () => {
  const { catalog } = setup()
  catalog.search = 'BACKPACK'
  assert.deepEqual(
    catalog.filtered.map((x) => x.id),
    [1],
  )
  catalog.search = 'blue'
  assert.deepEqual(
    catalog.filtered.map((x) => x.id),
    [1, 4],
  )
  catalog.search = 'jewelry'
  assert.deepEqual(
    catalog.filtered.map((x) => x.id),
    [3],
  )
  catalog.search = '  blue  '
  assert.equal(catalog.filtered.length, 2)
})
test('category filtering uses provider identifiers and friendly Jewelry spelling', () => {
  const { catalog } = setup()
  for (const category of catalog.categories) {
    catalog.setCategory(category.id)
    assert.equal(catalog.filtered.length, 1)
    assert.equal(catalog.filtered[0].category, category.id)
  }
  assert.equal(categoryLabel('jewelery'), 'Jewelry')
  catalog.setCategory('invalid')
  assert.equal(catalog.category, 'electronics')
})
test('category and search intersect; reset restores catalog order and full count', () => {
  const { catalog } = setup()
  catalog.search = 'blue'
  catalog.setCategory('electronics')
  assert.deepEqual(
    catalog.filtered.map((x) => x.id),
    [4],
  )
  catalog.search = 'no match'
  assert.equal(catalog.filtered.length, 0)
  catalog.resetFilters()
  assert.equal(catalog.filtered.length, 4)
})
test('price and rating sorts are deterministic and do not mutate source order', () => {
  const { catalog } = setup()
  for (const [sort, expected] of [
    ['price-asc', [4, 1, 2, 3]],
    ['price-desc', [3, 2, 1, 4]],
    ['rating', [3, 4, 1, 2]],
  ]) {
    catalog.sort = sort
    assert.deepEqual(
      catalog.filtered.map((x) => x.id),
      expected,
    )
  }
  assert.deepEqual(
    catalog.products.map((x) => x.id),
    [1, 2, 3, 4],
  )
})
test('empty cart initialization performs no storage write', () => {
  const { cart, storage } = setup()
  assert.equal(cart.quantity, 0)
  assert.equal(storage.writes, 0)
  assert.equal(cart.calculateTotal(), 0)
})
test('adding products merges identities and uses total quantities for badge counts', () => {
  const { cart, catalog } = setup()
  cart.addToCart(catalog.products[0], 2)
  cart.addToCart(catalog.products[0], 3)
  assert.deepEqual(
    cart.entries.map((x) => ({ ...x })),
    [{ id: 1, quantity: 5 }],
  )
  assert.equal(cart.quantity, 5)
  assert.equal(cart.items[0].lineTotalCents, 9995)
})
test('cart trusts only current catalog prices, not a caller-supplied or stored price', () => {
  const { cart, catalog } = setup(
    JSON.stringify([{ id: 1, quantity: 2, price: 0.01, priceCents: 1 }]),
  )
  assert.equal(cart.items[0].priceCents, 1999)
  cart.addToCart({ ...catalog.products[0], priceCents: 1 }, 1)
  assert.equal(cart.totals.subtotalCents, 5997)
})
test('unloaded or unknown products cannot be added', () => {
  const { cart, catalog } = setup()
  assert.throws(() => cart.addToCart({ id: 999 }, 1))
  catalog.status = 'error'
  assert.throws(() => cart.addToCart({ id: 1 }, 1))
  assert.equal(cart.quantity, 0)
})
test('invalid add quantities never mutate the cart', () => {
  const { cart, catalog } = setup()
  for (const quantity of [0, -1, 1.5, '2', 100, NaN])
    assert.throws(() => cart.addToCart(catalog.products[0], quantity))
  assert.equal(cart.quantity, 0)
})
test('quantity updates preserve the item at one; zero never silently removes it', () => {
  const { cart, catalog } = setup()
  cart.addToCart(catalog.products[0], 2)
  cart.updateQuantity(1, 1)
  assert.equal(cart.quantity, 1)
  for (const count of [0, -1, 100, 1.1])
    assert.throws(() => cart.updateQuantity(1, count))
  assert.equal(cart.items.length, 1)
})
test('maximum combined quantity is enforced without pretending to know stock', () => {
  const { cart, catalog } = setup()
  cart.addToCart(catalog.products[0], 99)
  assert.throws(
    () => cart.addToCart(catalog.products[0], 1),
    /application limit/,
  )
  assert.equal(cart.quantity, 99)
})
test('Remove deletes only the explicitly selected ID', () => {
  const { cart, catalog } = setup()
  cart.addToCart(catalog.products[0])
  cart.addToCart(catalog.products[1])
  assert.equal(cart.removeFromCart(1), true)
  assert.deepEqual(
    cart.entries.map((x) => x.id),
    [2],
  )
  assert.equal(cart.removeFromCart(999), false)
})
test('persistence serializes only ID and quantity, then restores against current catalog', () => {
  const { cart, catalog, storage } = setup()
  cart.addToCart(catalog.products[0], 2)
  assert.deepEqual(JSON.parse(storage.raw), [{ id: 1, quantity: 2 }])
  cart.initialize(storage)
  assert.equal(cart.items[0].quantity, 2)
  catalog.products = catalog.products.map((x) =>
    x.id === 1 ? { ...x, priceCents: 2500 } : x,
  )
  assert.equal(cart.totals.subtotalCents, 5000)
})
test('missing catalog IDs remain visible and preserved, block checkout, and can be explicitly removed', () => {
  const { cart, storage } = setup('[{"id":999,"quantity":2}]')
  assert.equal(cart.missing.length, 1)
  assert.equal(cart.quantity, 2)
  assert.equal(cart.canCheckout, false)
  assert.equal(storage.writes, 0)
  cart.removeFromCart(999)
  assert.deepEqual(JSON.parse(storage.raw), [])
})
test('malformed, unsupported, duplicate, negative and fractional cart data stays untouched', () => {
  for (const raw of [
    '{broken',
    'null',
    '{}',
    '[{"id":1,"quantity":0}]',
    '[{"id":1,"quantity":1},{"id":1,"quantity":2}]',
    '[{"id":1,"quantity":1.5}]',
  ]) {
    const { cart, storage, catalog } = setup(raw)
    assert.equal(cart.persistenceState, 'corrupt')
    assert.equal(storage.writes, 0)
    assert.throws(() => cart.addToCart(catalog.products[0]))
    assert.equal(storage.raw, raw)
  }
})
test('storage read failures protect unknown existing data', () => {
  const { cart } = setup()
  let writes = 0
  cart.initialize({
    getItem() {
      throw new Error('Denied')
    },
    setItem() {
      writes++
    },
  })
  assert.equal(cart.readOnly, true)
  assert.equal(writes, 0)
})
test('quota failures retain in-memory changes and allow a genuine retry', () => {
  const { cart, catalog, storage } = setup()
  const set = storage.setItem
  storage.setItem = () => {
    throw new Error('Quota')
  }
  cart.addToCart(catalog.products[0])
  assert.equal(cart.items.length, 1)
  assert.equal(cart.unsaved, true)
  assert.equal(storage.raw, null)
  storage.setItem = set
  assert.equal(cart.save(), true)
  assert.equal(cart.unsaved, false)
  assert.equal(JSON.parse(storage.raw).length, 1)
})
test('stale tabs cannot overwrite another saved cart snapshot', () => {
  const { cart, catalog, storage } = setup()
  storage.raw = '[{"id":2,"quantity":3}]'
  cart.addToCart(catalog.products[0])
  assert.equal(cart.persistenceState, 'conflict')
  assert.equal(storage.raw, '[{"id":2,"quantity":3}]')
  cart.reload()
  assert.equal(cart.items[0].id, 2)
})
test('external storage events pause editing without deleting the current view', () => {
  const { cart, catalog, storage } = setup()
  cart.addToCart(catalog.products[0])
  storage.raw = '[]'
  cart.checkExternalStorage()
  assert.equal(cart.readOnly, true)
  assert.equal(cart.items.length, 1)
})
test('confirmed recovery reset uses the original snapshot and clears only the cart key', () => {
  const { cart, storage } = setup('{broken')
  assert.equal(cart.exportData(true), '{broken')
  assert.equal(cart.resetStorage(), true)
  assert.equal(storage.raw, '[]')
  assert.equal(cart.readOnly, false)
})
test('recovery reset cannot overwrite a newer snapshot', () => {
  const { cart, storage } = setup('{broken')
  storage.raw = '[{"id":2,"quantity":1}]'
  assert.equal(cart.resetStorage(), false)
  assert.equal(cart.persistenceState, 'conflict')
  assert.equal(storage.raw, '[{"id":2,"quantity":1}]')
})
test('decimal-safe currency conversion handles cents, zero and invalid precision', () => {
  assert.equal(toCents(19.99), 1999)
  assert.equal(toCents(0.1), 10)
  assert.equal(toCents(0), 0)
  assert.equal(formatMoney(1999), '$19.99')
  for (const price of [-1, NaN, Infinity, 1.001])
    assert.throws(() => toCents(price))
})
test('subtotal, 8% tax, shipping and grand total use integer cents', () => {
  const result = calculatePricing([{ priceCents: 1999, quantity: 3 }])
  assert.deepEqual(result, {
    subtotalCents: 5997,
    taxCents: 480,
    shippingCents: 599,
    totalCents: 7076,
  })
})
test('shipping thresholds are applied to subtotal before tax', () => {
  assert.equal(
    calculatePricing([{ priceCents: 9999, quantity: 1 }]).shippingCents,
    599,
  )
  assert.equal(
    calculatePricing([{ priceCents: 10000, quantity: 1 }]).shippingCents,
    0,
  )
  assert.equal(calculatePricing([]).shippingCents, 0)
})
test('tax rounds a half cent upward and pricing rejects invalid line quantities', () => {
  assert.equal(calculatePricing([{ priceCents: 1, quantity: 1 }]).taxCents, 0)
  assert.equal(calculatePricing([{ priceCents: 7, quantity: 1 }]).taxCents, 1)
  assert.equal(
    calculatePricing([{ priceCents: 10, quantity: 1 }], {
      taxBasisPoints: 500,
      shippingCents: 0,
      freeShippingThresholdCents: 0,
    }).taxCents,
    1,
  )
  assert.throws(() => calculatePricing([{ priceCents: 100, quantity: 0 }]))
})
test('demo pricing assumptions are configurable without floating-point tax drift', () => {
  assert.deepEqual(
    calculatePricing([{ priceCents: 100, quantity: 1 }], {
      taxBasisPoints: 500,
      shippingCents: 99,
      freeShippingThresholdCents: 1000,
    }),
    { subtotalCents: 100, taxCents: 5, shippingCents: 99, totalCents: 204 },
  )
})
test('checkout snapshots current items and totals, generates a local reference, and then clears the cart', () => {
  const { cart, catalog, storage } = setup()
  cart.addToCart(catalog.products[0], 2)
  const order = cart.confirmCheckout({
    uuid: () => 'abcdefgh-1234',
    now: () => '2026-11-20T08:00:00Z',
  })
  assert.equal(order.reference, 'NX-ABCDEFGH')
  assert.equal(order.demo, true)
  assert.equal(order.items[0].quantity, 2)
  assert.equal(order.totals.subtotalCents, 3998)
  assert.equal(cart.quantity, 0)
  assert.equal(storage.raw, '[]')
  assert.equal(cart.lastOrder, order)
})
test('failed checkout storage clearing leaves the cart intact and confirms no order', () => {
  const { cart, catalog, storage } = setup()
  cart.addToCart(catalog.products[0])
  storage.setItem = () => {
    throw new Error('Quota')
  }
  assert.throws(() => cart.confirmCheckout(), /No demo order was confirmed/)
  assert.equal(cart.items.length, 1)
  assert.equal(cart.lastOrder, null)
  assert.equal(JSON.parse(storage.raw).length, 1)
})
test('empty, missing-product and duplicate checkout confirmation are prevented', () => {
  const { cart, catalog } = setup()
  assert.throws(() => cart.confirmCheckout())
  cart.addToCart(catalog.products[0])
  cart.confirmCheckout()
  const order = cart.lastOrder
  assert.throws(() => cart.confirmCheckout())
  assert.equal(cart.lastOrder, order)
})
test('storage helper refuses unsafe outgoing records and preserves original data', () => {
  const storage = memoryStorage('[]')
  assert.equal(saveCart([{ id: 1, quantity: -1 }], storage, '[]').ok, false)
  assert.equal(storage.raw, '[]')
  assert.equal(loadCart(storage).state, 'ready')
})
let vite, ProductCard
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: 'custom',
    logLevel: 'error',
  })
  ProductCard = (await vite.ssrLoadModule('/src/components/ProductCard.vue'))
    .default
})
after(async () => {
  await vite?.close()
})
test('real Vue product card renders API title, price, rating, category and functional controls', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const product = normalizeCatalog(rawProducts).products[0]
  const app = createSSRApp(ProductCard, { product })
  app.use(pinia)
  const html = await renderToString(app)
  assert.match(html, /Test Canvas Backpack/)
  assert.match(html, /\$19.99/)
  assert.match(html, /4.2/)
  assert.match(html, /Add to cart/)
  assert.match(html, /View details/)
  assert.match(html, /Men&#39;s Clothing|Men's Clothing/)
})
