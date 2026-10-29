import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('public share surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('missing /s/$token shows gone state', async ({ page }) => {
    await page.goto('/s/e2e-missing-token-xyz')
    await expect(
      page.getByRole('heading', { name: /Odkaz neexistuje|Odkaz vypršal|Odkaz bol zrušený|Príliš veľa požiadaviek/ }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('body')).toContainText(/HTTP 410|neplatný|požiadaviek/i)
  })

  test('missing /e/$token shows embed gone state', async ({ page }) => {
    await page.goto('/e/e2e-missing-embed-xyz')
    await expect(
      page.getByText(
        /Súbor sa nenašiel|Odkaz vypršal|Odkaz bol zrušený|Príliš veľa požiadaviek/,
      ),
    ).toBeVisible({ timeout: 15_000 })
  })
})
