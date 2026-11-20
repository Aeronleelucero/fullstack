import { test, expect } from '@playwright/test'
import { writeFileSync, readFileSync } from 'node:fs'
test('real API: default city, global search, current weather, five-day forecast', async ({
  page,
}) => {
  test.skip(
    process.env.ATMOS_LIVE_TEST !== '1',
    'Opt-in live network check; regular tests mock responses.',
  )
  const errors = [],
    actual = []
  page.on('response', async (response) => {
    if (response.url().startsWith('https://api.open-meteo.com/')) {
      const json = await response.json()
      actual.push({
        status: response.status(),
        url: response.url(),
        timezone: json.timezone,
        current: json.current,
        forecastDates: json.daily?.time,
      })
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))
  const policy = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url)),
  ).headers[0].headers.find(
    (header) => header.key === 'Content-Security-Policy',
  ).value
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) => {
      window.atmosPolicyViolations ??= []
      window.atmosPolicyViolations.push(event.violatedDirective)
    }),
  )
  await page.route('**/*', async (route) => {
    if (route.request().isNavigationRequest()) {
      const response = await route.fetch()
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': policy },
      })
    } else await route.continue()
  })
  await page.goto('/')
  await expect(page.locator('#current-city')).toHaveText('Manila', {
    timeout: 20000,
  })
  await expect(page.locator('.forecast-card')).toHaveCount(5)
  await page.getByRole('combobox').fill('Tokyo')
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 20000 })
  await page.getByRole('option').filter({ hasText: 'Japan' }).first().click()
  await expect(page.locator('#current-city')).toHaveText('Tokyo', {
    timeout: 20000,
  })
  await expect(page.locator('.forecast-card')).toHaveCount(5)
  expect(errors).toEqual([])
  await page.screenshot({ path: '/tmp/atmos-live-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 900 })
  await page.locator('#forecast').scrollIntoViewIfNeeded()
  await expect(page.locator('.forecast-card').first()).toBeInViewport()
  await page.locator('.local-perspective').scrollIntoViewIfNeeded()
  await expect(page.locator('.local-perspective')).toBeInViewport()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: '/tmp/atmos-live-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.screenshot({ path: '/tmp/atmos-live-light.png', fullPage: true })
  await page.getByRole('combobox').fill('São Paulo')
  await expect(
    page.getByRole('option').filter({ hasText: 'Brazil' }).first(),
  ).toBeVisible({ timeout: 20000 })
  await page.getByRole('combobox').press('Escape')
  expect(actual).toHaveLength(2)
  expect(actual.every((result) => result.status === 200)).toBe(true)
  expect(await page.evaluate(() => window.atmosPolicyViolations || [])).toEqual(
    [],
  )
  writeFileSync(
    '/tmp/atmos-live-results.json',
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        browser: page.context().browser().version(),
        actual,
        errors,
      },
      null,
      2,
    ),
  )
})
