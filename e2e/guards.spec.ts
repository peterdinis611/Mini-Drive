import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('guest route guards', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  for (const path of ['/files', '/settings', '/trash', '/shares', '/recent']) {
    test(`${path} redirects guests to sign-in`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 })
    })
  }

  test('/onboarding redirects guests to sign-in', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 })
  })
})
