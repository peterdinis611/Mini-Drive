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
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('sign-in route renders Clerk form', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector(
      '[data-clerk-component], form, input[name="identifier"], input[type="email"]',
      { timeout: 15_000 },
    )
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('sign-up route renders Clerk form', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector(
      '[data-clerk-component], form, input[name="identifier"], input[type="email"], input[name="emailAddress"]',
      { timeout: 15_000 },
    )
    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('legacy /login redirects to sign-in', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('legacy /register redirects to sign-up', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/sign-up/)
  })
})
