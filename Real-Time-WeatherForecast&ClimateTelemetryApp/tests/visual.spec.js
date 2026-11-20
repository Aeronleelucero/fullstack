import { test, expect } from '@playwright/test'
import { payload } from './fixtures.js'
test('mobile forecast and daylight remain navigable after resize', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: payload() }),
  )
  await page.goto('/')
  await expect(page.locator('.forecast-card')).toHaveCount(5)
  await page.setViewportSize({ width: 375, height: 900 })
  await page.locator('#forecast').scrollIntoViewIfNeeded()
  await expect(page.locator('.forecast-card').first()).toBeInViewport()
  await page.screenshot({ path: '/tmp/atmos-mobile-forecast-viewport.png' })
  await page.locator('.local-perspective').scrollIntoViewIfNeeded()
  await expect(page.locator('.local-perspective')).toBeInViewport()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({ path: '/tmp/atmos-mobile-daylight-viewport.png' })
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: '/tmp/atmos-mobile-painted-full.png',
    fullPage: true,
  })
})
