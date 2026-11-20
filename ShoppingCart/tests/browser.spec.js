import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { rawProducts, fixtureSvg } from './fixtures.js'
const key = 'nexora.cart.v1'
const axe = (page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
async function mock(page, handler) {
  await page.route(
    'https://fakestoreapi.com/products',
    handler || ((route) => route.fulfill({ json: rawProducts })),
  )
  await page.route('https://fakestoreapi.com/img/**', (route) =>
    route.fulfill({ body: fixtureSvg, contentType: 'image/svg+xml' }),
  )
}
async function ready(page) {
  await page.goto('/')
  await expect(page.locator('.product-card')).toHaveCount(4)
}
function add(page, id = 1) {
  const product = rawProducts.find((product) => product.id === id)
  return page
    .getByRole('button', { name: `Add to cart: ${product.title}`, exact: true })
    .click()
}
async function openCart(page) {
  await page.locator('#cart-trigger').click()
  await expect(page.getByRole('dialog', { name: /Your cart/ })).toBeVisible()
}

test('catalog cards use supplied prices/ratings with no console errors or missing assets', async ({
  page,
}) => {
  const errors = [],
    failed = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(response.url())
  })
  await mock(page)
  await ready(page)
  await expect(page.locator('.product-card').first()).toContainText('$19.99')
  await expect(page.locator('.product-card').first()).toContainText('4.2')
  await expect(page.locator('.results-count')).toHaveText('4 of 4 products')
  expect(errors).toEqual([])
  expect(failed).toEqual([])
})
test('loading skeletons contain no invented catalog values', async ({
  page,
}) => {
  let release
  const gate = new Promise((resolve) => (release = resolve))
  await mock(page, async (route) => {
    await gate
    await route.fulfill({ json: rawProducts })
  })
  await page.goto('/')
  await expect(
    page.getByRole('status', { name: 'Loading product catalog' }),
  ).toBeVisible()
  await expect(page.locator('.product-card')).toHaveCount(0)
  release()
  await expect(page.locator('.product-card')).toHaveCount(4)
})
for (const kind of ['network', 'service', 'rate-limit', 'invalid'])
  test(`${kind} catalog failure is honest and retry makes a new request`, async ({
    page,
  }) => {
    let fail = true,
      requests = 0
    await mock(page, (route) => {
      requests++
      return fail
        ? kind === 'network'
          ? route.abort('failed')
          : kind === 'invalid'
            ? route.fulfill({ body: '{bad' })
            : route.fulfill({
                status: kind === 'rate-limit' ? 429 : 503,
                json: {},
              })
        : route.fulfill({ json: rawProducts })
    })
    await page.goto('/')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('.product-card')).toHaveCount(0)
    fail = false
    await page.getByRole('button', { name: 'Retry catalog' }).click()
    await expect(page.locator('.product-card')).toHaveCount(4)
    expect(requests).toBe(2)
  })
test('search, category filters, sorting, count and clear combine locally', async ({
  page,
}) => {
  let requests = 0
  await mock(page, (route) => {
    requests++
    return route.fulfill({ json: rawProducts })
  })
  await ready(page)
  await page.locator('#product-search').fill('BLUE')
  await expect(page.locator('.product-card')).toHaveCount(2)
  await page
    .locator('.filter-chips')
    .getByRole('button', { name: 'Electronics', exact: true })
    .click()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await expect(page.locator('.product-card')).toContainText('Headphones')
  await page.locator('#product-search').fill('no match')
  await expect(page.getByText('Nothing quite fits that search.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(page.locator('.product-card')).toHaveCount(4)
  await page.locator('#product-sort').selectOption('price-desc')
  await expect(page.locator('.product-card').first()).toContainText(
    'Silver Ring',
  )
  await page.locator('#product-sort').selectOption('rating')
  await expect(page.locator('.product-card').first()).toContainText(
    'Silver Ring',
  )
  await page.locator('#product-sort').selectOption('price-asc')
  await expect(page.locator('.product-card').first()).toContainText(
    'Headphones',
  )
  expect(requests).toBe(1)
})
test('header search supports Enter and clear without runtime errors', async ({
  page,
}) => {
  await mock(page)
  await ready(page)
  await page.locator('#product-search').fill('backpack')
  await page.locator('#product-search').press('Enter')
  await expect(page.locator('#shop')).toBeInViewport()
  await page.getByRole('button', { name: 'Clear product search' }).click()
  await expect(page.locator('.product-card')).toHaveCount(4)
})
test('details dialog supports quantity, add, focus containment and Escape focus return', async ({
  page,
}) => {
  await mock(page)
  await ready(page)
  const opener = page.getByRole('button', {
    name: `View details for ${rawProducts[0].title}`,
  })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: rawProducts[0].title }),
  ).toBeVisible()
  await expect(dialog).toContainText(rawProducts[0].description)
  await expect(
    dialog.getByRole('button', { name: /Decrease quantity/ }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: /Increase quantity/ }).click()
  await dialog.getByRole('button', { name: 'Add to cart · $39.98' }).click()
  await expect(
    dialog.getByRole('status').filter({ hasText: '2 added' }),
  ).toContainText('2 added')
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true)
  }
  await page.keyboard.press('Shift+Tab')
  expect(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    'hidden',
  )
})
test('cart merges products, counts quantities, calculates exact totals and persists only ID/quantity', async ({
  page,
}) => {
  await mock(page)
  await ready(page)
  await add(page)
  await add(page)
  await expect(page.locator('#cart-trigger')).toHaveAttribute(
    'aria-label',
    'Open shopping cart, 2 items',
  )
  await openCart(page)
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.getByTestId('grand-total')).toHaveText('$49.17')
  await expect(page.getByRole('dialog')).toContainText('8%, demo')
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key),
  ).toEqual([{ id: 1, quantity: 2 }])
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.reload()
  await expect(page.locator('.product-card')).toHaveCount(4)
  await openCart(page)
  await expect(page.locator('.quantity-selector output')).toHaveText('2')
})
test('cart increments and decrements, disables zero, and removes only explicitly', async ({
  page,
}) => {
  await mock(page)
  await ready(page)
  await add(page)
  await openCart(page)
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('button', { name: /Decrease quantity/ }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: /Increase quantity/ }).click()
  await expect(page.locator('.quantity-selector output')).toHaveText('2')
  await dialog.getByRole('button', { name: /Decrease quantity/ }).click()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await dialog
    .getByRole('button', { name: `Remove ${rawProducts[0].title}` })
    .click()
  await expect(page.locator('.cart-item')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'A little room for discovery.' }),
  ).toBeVisible()
  await expect(page.locator('#cart-title')).toBeFocused()
})
test('quantity demo limit disables invalid actions and never claims stock', async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '[{"id":1,"quantity":99}]'),
    key,
  )
  await mock(page)
  await ready(page)
  await expect(
    page.getByRole('button', { name: `Add to cart: ${rawProducts[0].title}` }),
  ).toBeDisabled()
  await openCart(page)
  await expect(
    page.getByRole('button', { name: /Increase quantity/ }),
  ).toBeDisabled()
})
test('current catalog prices override tampered stored prices and unavailable IDs require explicit removal', async ({
  page,
}) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        '[{"id":1,"quantity":1,"priceCents":1},{"id":999,"quantity":2}]',
      ),
    key,
  )
  await mock(page)
  await ready(page)
  await openCart(page)
  await expect(page.locator('.unit-price')).toHaveText('$19.99 each')
  await expect(page.locator('.missing-items')).toContainText('Product #999')
  await expect(
    page.getByRole('button', { name: 'Review demo checkout' }),
  ).toBeDisabled()
  await page
    .getByRole('button', { name: 'Remove unavailable product 999' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Review demo checkout' }),
  ).toBeEnabled()
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key),
  ).toEqual([{ id: 1, quantity: 1 }])
})
test('corrupt storage preserves original data, offers download and requires explicit reset confirmation', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (!sessionStorage.seeded) {
      localStorage.setItem(key, '{broken original')
      localStorage.setItem('unrelated.demo', 'preserve')
      sessionStorage.seeded = 'yes'
    }
  }, key)
  await mock(page)
  await ready(page)
  await expect(
    page.getByRole('button', { name: `Add to cart: ${rawProducts[0].title}` }),
  ).toBeDisabled()
  await openCart(page)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download original data' }).click(),
  ])
  const { readFile } = await import('node:fs/promises')
  expect(await readFile(await download.path(), 'utf8')).toBe('{broken original')
  await page
    .getByRole('button', { name: 'Reset saved cart', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '{broken original',
  )
  await page
    .getByRole('button', { name: 'Reset saved cart', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Reset saved cart', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: /Your cart/ })).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '[]',
  )
  expect(
    await page.evaluate(() => localStorage.getItem('unrelated.demo')),
  ).toBe('preserve')
})
test('quota failure retains cart changes and retry saves them when access returns', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    window.failCartWrites = true
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.failCartWrites)
        throw new DOMException('Quota', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, key)
  await mock(page)
  await ready(page)
  await add(page)
  await openCart(page)
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.getByRole('alert')).toContainText('only in memory')
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull()
  await page.evaluate(() => (window.failCartWrites = false))
  await page.getByRole('button', { name: 'Retry saving' }).click()
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key),
  ).toEqual([{ id: 1, quantity: 1 }])
})
test('checkout is explicitly simulated, confirms locally, clears cart, and sends no order request', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url())
  })
  await mock(page)
  await ready(page)
  await add(page, 3)
  await openCart(page)
  await expect(page.getByTestId('grand-total')).toHaveText('$108.00')
  await page.getByRole('button', { name: 'Review demo checkout' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your demo checkout.' }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText(
    'No real order. No real payment.',
  )
  await expect(page.getByRole('dialog').locator('input')).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirm demo order' }).click()
  await expect(
    page.getByRole('heading', { name: 'Demo complete.' }),
  ).toBeVisible()
  await expect(page.getByTestId('order-reference')).toHaveText(
    /^NX-[A-F0-9]{8}$/,
  )
  await expect(page.getByRole('dialog')).toContainText('No payment was taken.')
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '[]',
  )
  expect(writes).toEqual([])
  await page.getByRole('button', { name: 'Continue exploring' }).click()
  await expect(page.locator('#cart-trigger')).toBeFocused()
})
test('checkout failure never clears the cart or displays a fake confirmation', async ({
  page,
}) => {
  await mock(page)
  await ready(page)
  await add(page)
  await openCart(page)
  await page.getByRole('button', { name: 'Review demo checkout' }).click()
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Quota', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, key)
  await page.getByRole('button', { name: 'Confirm demo order' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'No demo order was confirmed' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Demo complete.' }),
  ).toHaveCount(0)
  expect(
    JSON.parse(await page.evaluate((key) => localStorage.getItem(key), key)),
  ).toHaveLength(1)
})
test('failed product images use an explicit safe fallback', async ({
  page,
}) => {
  await mock(page)
  await page.unroute('https://fakestoreapi.com/img/**')
  await page.route('https://fakestoreapi.com/img/**', (route) => route.abort())
  await ready(page)
  await page.locator('#shop').scrollIntoViewIfNeeded()
  await expect(
    page
      .locator('.product-card')
      .first()
      .getByRole('img', { name: /Image unavailable/ }),
  ).toBeVisible()
})
test('system theme, explicit preference persistence, and reduced motion work', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await mock(page)
  await ready(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('.product-card')).toHaveCount(4)
  await openCart(page)
  expect(
    await page
      .getByRole('dialog')
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none')
  await page.keyboard.press('Escape')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await openCart(page)
  expect(
    await page
      .getByRole('dialog')
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('drawer-in')
})
test('responsive layouts, mobile menu and cart remain usable at every requested width in both themes', async ({
  page,
}) => {
  test.setTimeout(90000)
  await mock(page)
  await ready(page)
  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-theme')) !== theme)
      await page
        .getByRole('button', { name: `Switch to ${theme} theme` })
        .click()
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${theme} ${width} overflow`,
      ).toBe(true)
      await page.locator('#shop').scrollIntoViewIfNeeded()
      const overlap = await page.locator('.product-card').evaluateAll((cards) =>
        cards.some((a, i) =>
          cards.slice(i + 1).some((b) => {
            const x = a.getBoundingClientRect(),
              y = b.getBoundingClientRect()
            return (
              x.left < y.right - 1 &&
              x.right > y.left + 1 &&
              x.top < y.bottom - 1 &&
              x.bottom > y.top + 1
            )
          }),
        ),
      )
      expect(overlap).toBe(false)
      await openCart(page)
      expect(
        await page
          .getByRole('dialog')
          .evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true)
      await page.keyboard.press('Escape')
    }
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await dialog.getByRole('link', { name: 'Shop the collection' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to products' }),
  ).toBeFocused()
})
test('axe audits cover catalog, product modal, cart, checkout and confirmation in both themes', async ({
  page,
}) => {
  test.setTimeout(90000)
  await mock(page)
  await ready(page)
  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-theme')) !== theme)
      await page
        .getByRole('button', { name: `Switch to ${theme} theme` })
        .click()
    expect((await axe(page)).violations).toEqual([])
    await page
      .getByRole('button', { name: `View details for ${rawProducts[0].title}` })
      .click()
    expect((await axe(page)).violations).toEqual([])
    await page.keyboard.press('Escape')
    await add(page)
    await openCart(page)
    expect((await axe(page)).violations).toEqual([])
    await page.getByRole('button', { name: 'Review demo checkout' }).click()
    expect((await axe(page)).violations).toEqual([])
    await page.getByRole('button', { name: 'Confirm demo order' }).click()
    expect((await axe(page)).violations).toEqual([])
    await page.keyboard.press('Escape')
  }
})
