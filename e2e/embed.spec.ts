import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

import { postgresReady } from './helpers'

test.describe('public embed surface', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(!(await postgresReady(request)), 'Postgres required for embed')
    await setupClerkTestingToken({ page })
  })

  test('missing embed token shows gone UI without app chrome leak', async ({
    page,
  }) => {
    await page.goto('/e/e2e-embed-missing-abc')
    await expect(
      page.getByText(
        /Súbor sa nenašiel|Odkaz vypršal|Odkaz bol zrušený|Príliš veľa požiadaviek/,
      ),
    ).toBeVisible({ timeout: 15_000 })
    // Embed should not mount the full Drive shell sidebar.
    await expect(
      page.getByRole('navigation', { name: /Drive|súbory/i }),
    ).toHaveCount(0)
  })

  test('embed HTTP status stays below 500', async ({ request }) => {
    const res = await request.get('/e/e2e-embed-api-missing')
    expect(res.status()).toBeLessThan(500)
    expect([200, 404, 410, 429]).toContain(res.status())
  })

  test('very long embed token does not crash', async ({ page }) => {
    const token = `e2e-${'x'.repeat(200)}`
    await page.goto(`/e/${token}`)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).toContainText(/.+/)
  })
})
