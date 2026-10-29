import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

/**
 * Baseline Clerk + Playwright wiring.
 * Full sign-in flows need CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY (pk_test/sk_test)
 * and Email+Password enabled on the Clerk development instance.
 *
 * @see https://clerk.com/docs/guides/development/testing/playwright/overview
 */
test.describe('auth pages', () => {
  test('sign-in route renders Clerk form', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/sign-in')
    await page.waitForSelector(
      '[data-clerk-component], form, input[type="email"]',
      {
        timeout: 15_000,
      },
    )
    await expect(page.locator('body')).toBeVisible()
  })
})
