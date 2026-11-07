import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('not found', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('unknown path shows 404 status page', async ({ page }) => {
    await page.goto('/e2e-definitely-missing-route-xyz')
    await expect(
      page.getByRole('heading', {
        name: /Táto cesta v archíve nie je|nenájden/i,
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('body')).toContainText(/HTTP 404|404/)
  })

  test('deep unknown path under files still redirects guests to sign-in', async ({
    page,
  }) => {
    await page.goto('/files/00000000-0000-4000-8000-000000000000')
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 })
  })

  test('404 page exposes Domov and Späť do súborov actions', async ({
    page,
  }) => {
    await page.goto('/e2e-missing-actions-check')
    await expect(
      page.getByRole('heading', { name: /Táto cesta v archíve nie je/i }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'Domov' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Späť do súborov/i }),
    ).toBeVisible()
  })

  test('Späť do súborov from 404 sends guests to sign-in', async ({ page }) => {
    await page.goto('/e2e-missing-back-to-files')
    await page.getByRole('link', { name: /Späť do súborov/i }).click()
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 })
  })
})
