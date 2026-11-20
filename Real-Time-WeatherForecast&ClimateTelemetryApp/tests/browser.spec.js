import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { payload, city, tokyo } from './fixtures.js'
const key = 'atmos.preferences.v1'
async function weatherRoute(page, handler) {
  await page.route(
    'https://api.open-meteo.com/**',
    handler || ((route) => route.fulfill({ json: payload() })),
  )
}
async function ready(page) {
  await expect(page.locator('#current-city')).toHaveText('Manila')
  await expect(page.locator('.forecast-card')).toHaveCount(5)
}
const axe = (page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T06:03:00Z'))
})

test('renders five forecasts, actual model fields, no missing assets or console errors', async ({
  page,
}) => {
  const errors = [],
    missing = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) missing.push(response.url())
  })
  await weatherRoute(page)
  await page.goto('/')
  await ready(page)
  await expect(page.getByTestId('current-temperature')).toHaveText('28')
  await expect(page.locator('.current-condition')).toHaveText('Partly cloudy')
  await expect(page.locator('.detail-value').nth(0)).toContainText('72')
  await expect(page.locator('.detail-value').nth(1)).toContainText('12.4')
  await expect(page.locator('.detail-value').nth(2)).toContainText('1,012')
  await expect(page.locator('.forecast-card').first()).toContainText('Today')
  expect(errors).toEqual([])
  expect(missing).toEqual([])
})
test('shows initial loading, then successful data without placeholder measurements', async ({
  page,
}) => {
  let release
  const gate = new Promise((resolve) => (release = resolve))
  await weatherRoute(page, async (route) => {
    await gate
    await route.fulfill({ json: payload() })
  })
  await page.goto('/')
  await expect(page.locator('.weather-loading')).toBeVisible()
  await expect(page.getByTestId('current-temperature')).toHaveCount(0)
  release()
  await ready(page)
})
test('units and themes persist, and unit changes do not request weather', async ({
  page,
}) => {
  let requests = 0
  await weatherRoute(page, (route) => {
    requests++
    return route.fulfill({ json: payload() })
  })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: /Fahrenheit/ }).click()
  await expect(page.getByTestId('current-temperature')).toHaveText('83')
  await expect(page.locator('.forecast-card').first()).toContainText('88°')
  expect(requests).toBe(1)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.reload()
  await ready(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(
    page.getByRole('button', { name: /Fahrenheit/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(requests).toBe(2)
  const prefs = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  )
  expect(prefs.location.id).toBe(city.id)
  expect(Object.keys(prefs).sort()).toEqual([
    'location',
    'theme',
    'unit',
    'version',
  ])
})
test('ambiguous cities are displayed and selected by keyboard, never assumed', async ({
  page,
}) => {
  const other = {
    ...city,
    id: 5777855,
    name: 'Manila',
    country: 'United States',
    admin1: 'Utah',
    latitude: 40.98801,
    longitude: -109.72265,
    timezone: 'America/Denver',
  }
  await weatherRoute(page)
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { results: [{ ...city, admin1: city.region }, other] },
    }),
  )
  await page.goto('/')
  await ready(page)
  const input = page.getByRole('combobox')
  await input.fill('Manila')
  await expect(page.getByRole('option')).toHaveCount(2)
  await expect(page.getByRole('option').nth(1)).toContainText('United States')
  await input.press('ArrowDown')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page.locator('.current-country')).toContainText('United States')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).location.id,
      key,
    ),
  ).toBe(other.id)
})
test('empty queries, invalid cities, no results, and search retry work', async ({
  page,
}) => {
  await weatherRoute(page)
  let queries = 0
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    queries++
    return route.fulfill({ json: {} })
  })
  await page.goto('/')
  await ready(page)
  const input = page.getByRole('combobox')
  await input.press('Enter')
  await expect(
    page.getByText('Enter at least two characters to search.'),
  ).toBeVisible()
  expect(queries).toBe(0)
  await input.fill('NotARealPlace')
  await expect(
    page.getByText('No cities found.', { exact: false }),
  ).toBeVisible()
  await input.press('Escape')
  await expect(page.locator('.search-popover')).toHaveCount(0)
  await page.unroute('https://geocoding-api.open-meteo.com/**')
  let fail = true
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    fail
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { results: [tokyo] } }),
  )
  await input.fill('Tokyo')
  await expect(page.getByRole('button', { name: 'Retry search' })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Retry search' }).click()
  await expect(page.getByRole('option')).toHaveCount(1)
})
test('stale city-search results cannot overwrite the newer query', async ({
  page,
}) => {
  await weatherRoute(page)
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const old =
      new URL(route.request().url()).searchParams.get('name') === 'Older'
    if (old) await new Promise((resolve) => setTimeout(resolve, 1000))
    await route
      .fulfill({ json: { results: [old ? city : tokyo] } })
      .catch(() => {})
  })
  await page.goto('/')
  await ready(page)
  await page.getByRole('combobox').fill('Older')
  await page.waitForRequest((request) => request.url().includes('name=Older'))
  await page.getByRole('combobox').fill('Tokyo')
  await expect(page.getByRole('option')).toContainText('Tokyo')
  await page.waitForTimeout(1100)
  await expect(page.getByRole('option')).toContainText('Tokyo')
})
for (const scenario of [
  { name: 'network', status: null, text: 'Check your connection' },
  { name: 'rate limit', status: 429, text: 'too many requests' },
  { name: 'configuration', status: 403, text: 'configuration needs attention' },
  { name: 'server', status: 503, text: 'temporarily unavailable' },
]) {
  test(`${scenario.name} failure is honest and retry performs a new request`, async ({
    page,
  }) => {
    let fail = true,
      requests = 0
    await weatherRoute(page, (route) => {
      requests++
      return fail
        ? scenario.status
          ? route.fulfill({ status: scenario.status, json: {} })
          : route.abort('failed')
        : route.fulfill({ json: payload() })
    })
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText(scenario.text)
    await expect(page.getByTestId('current-temperature')).toHaveCount(0)
    await expect(page.locator('.forecast-card')).toHaveCount(0)
    fail = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await ready(page)
    expect(requests).toBe(2)
  })
}
test('corrupt preferences and simulated storage quota failures are non-destructive', async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{original broken'),
    key,
  )
  await weatherRoute(page)
  await page.goto('/')
  await ready(page)
  await expect(
    page.getByRole('status').filter({ hasText: 'original data is unchanged' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Fahrenheit/ }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '{original broken',
  )
  await expect(page.getByTestId('current-temperature')).toHaveText('83')
})
test('quota failures keep the interface functional and preserve saved preferences', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, key)
  await weatherRoute(page)
  await page.goto('/')
  await ready(page)
  await expect(
    page.getByText('Preferences could not be saved.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Fahrenheit/ }).click()
  await expect(page.getByTestId('current-temperature')).toHaveText('83')
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull()
})
test('weather theme uses API day/night status and respects reduced motion', async ({
  page,
}) => {
  let data = payload({ code: 0, isDay: 0 })
  await weatherRoute(page, (route) => route.fulfill({ json: data }))
  await page.goto('/')
  await ready(page)
  await expect(page.locator('.weather-background')).toHaveClass(
    /atmosphere-night/,
  )
  await expect(page.locator('.day-tag')).toContainText('Nighttime')
  for (const [code, expected] of [
    [0, 'sunny'],
    [3, 'cloudy'],
    [61, 'rainy'],
    [95, 'stormy'],
    [71, 'snowy'],
  ]) {
    data = payload({ code })
    await page.getByRole('button', { name: 'Refresh weather' }).click()
    await expect(page.locator('.weather-background')).toHaveClass(
      new RegExp(`atmosphere-${expected}`),
    )
  }
  expect(
    await page
      .locator('.weather-art > .weather-icon')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(
    await page
      .locator('.weather-art > .weather-icon')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('float')
})
test('responsive navigation, accessible search, card layouts and both-theme contrast', async ({
  page,
}) => {
  await weatherRoute(page)
  await page.goto('/')
  await ready(page)
  for (const theme of ['dark', 'light']) {
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
        `${width} ${theme} root overflow`,
      ).toBe(true)
      const overlaps = await page
        .locator('.forecast-card')
        .evaluateAll((cards) =>
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
      expect(overlaps).toBe(false)
      await page
        .getByRole('link', { name: '5-day forecast', exact: true })
        .click()
      await expect(page.locator('#forecast')).toBeInViewport()
      await page.getByRole('link', { name: 'Overview', exact: true }).click()
      await expect(page.getByRole('combobox')).toBeVisible()
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    const result = await axe(page)
    expect(result.violations).toEqual([])
  }
  await page.setViewportSize({ width: 375, height: 900 })
  const result = await axe(page)
  expect(result.violations).toEqual([])
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to weather' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})
test('search results and error states have no configured axe violations', async ({
  page,
}) => {
  await weatherRoute(page)
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city, tokyo] } }),
  )
  await page.goto('/')
  await ready(page)
  await page.getByRole('combobox').fill('Manila')
  await expect(page.getByRole('option')).toHaveCount(2)
  expect((await axe(page)).violations).toEqual([])
  await page.getByRole('combobox').press('Escape')
  await page.unroute('https://api.open-meteo.com/**')
  await weatherRoute(page, (route) => route.fulfill({ status: 503, json: {} }))
  await page.getByRole('button', { name: 'Refresh weather' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  expect((await axe(page)).violations).toEqual([])
})
