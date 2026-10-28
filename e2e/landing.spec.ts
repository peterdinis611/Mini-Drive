import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('public landing', () => {
  test('loads marketing home', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/')
    await expect(page).toHaveTitle(/Mini Drive|Drive/i)
  })
})
