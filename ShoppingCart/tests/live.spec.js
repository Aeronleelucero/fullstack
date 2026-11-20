import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
test('real FakeStoreAPI catalog, photos, filters, cart and demo checkout under production CSP', async ({
  page,
}) => {
  test.skip(
    process.env.NEXORA_LIVE_TEST !== '1',
    'Opt-in real network check; deterministic tests use fixtures.',
  )
  test.setTimeout(60000)
  const errors = [],
    responses = [],
    writes = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url())
  })
  page.on('response', async (response) => {
    if (response.url() === 'https://fakestoreapi.com/products') {
      const data = await response.json()
      responses.push({
        status: response.status(),
        count: data.length,
        ids: data.map((item) => item.id),
      })
    }
  })
  const csp = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url)),
  ).headers[0].headers.find(
    (header) => header.key === 'Content-Security-Policy',
  ).value
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) => {
      window.nexoraPolicyViolations ??= []
      window.nexoraPolicyViolations.push(event.violatedDirective)
    }),
  )
  await page.route('**/*', async (route) => {
    if (route.request().isNavigationRequest()) {
      const response = await route.fetch()
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': csp },
      })
    } else await route.continue()
  })
  await page.goto('/')
  await expect(page.locator('.product-card').first()).toBeVisible({
    timeout: 25000,
  })
  expect(await page.locator('.product-card').count()).toBeGreaterThan(0)
  await expect(page.locator('.hero-product-main img')).toBeVisible()
  await page
    .locator('.hero-product-main img')
    .evaluate((image) => image.decode())
  // Fully decode remote photos for full-page QA captures; runtime images stay lazy.
  await page.evaluate(async () => {
    const images = [...document.querySelectorAll('img')]
    images.forEach((image) => (image.loading = 'eager'))
    await Promise.all(
      images.map((image) =>
        Promise.race([
          image.decode().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 10000)),
        ]),
      ),
    )
  })
  await page.screenshot({
    path: '/tmp/nexora-live-desktop.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 375, height: 900 })
  await page.locator('#shop').scrollIntoViewIfNeeded()
  await page.locator('.app-footer').scrollIntoViewIfNeeded()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: '/tmp/nexora-live-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  )
  await page.screenshot({ path: '/tmp/nexora-dark-hero-viewport.png' })
  await page.locator('.product-card').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: '/tmp/nexora-dark-catalog-viewport.png' })
  const imageMetrics = await page
    .locator('.product-card img')
    .evaluateAll((images) =>
      images.map((image) => ({
        naturalWidth: image.naturalWidth,
        complete: image.complete,
        height: image.getBoundingClientRect().height,
        parentHeight: image.parentElement.getBoundingClientRect().height,
      })),
    )
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: '/tmp/nexora-live-dark.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', { name: /View details/ })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Add to cart/ })
    .click()
  await page.keyboard.press('Escape')
  await page.locator('#cart-trigger').click()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await page.getByRole('button', { name: 'Review demo checkout' }).click()
  await page.getByRole('button', { name: 'Confirm demo order' }).click()
  await expect(
    page.getByRole('heading', { name: 'Demo complete.' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('nexora.cart.v1')),
  ).toBe('[]')
  expect(errors).toEqual([])
  expect(writes).toEqual([])
  expect(
    await page.evaluate(() => window.nexoraPolicyViolations || []),
  ).toEqual([])
  writeFileSync(
    '/tmp/nexora-live-results.json',
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        browser: page.context().browser().version(),
        catalog: responses,
        renderedProducts: await page.locator('.product-card').count(),
        imageMetrics,
        pageErrors: errors,
        nonGetRequests: writes,
        policyViolations: await page.evaluate(
          () => window.nexoraPolicyViolations || [],
        ),
      },
      null,
      2,
    ),
  )
})
