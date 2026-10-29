import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

async function postgresReady(
  request: import('@playwright/test').APIRequestContext,
) {
  const res = await request.get('/api/health')
  if (res.status() !== 200) return false
  const body = (await res.json()) as { status?: string }
  return body.status === 'ok'
}

test.describe('public share surfaces', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(
      !(await postgresReady(request)),
      'Postgres required for share resolve',
    )
    await setupClerkTestingToken({ page })
  })

  test('missing /s/$token shows gone state', async ({ page }) => {
    await page.goto('/s/e2e-missing-token-xyz')
    await expect(
      page.getByRole('heading', {
        name: /Odkaz neexistuje|Odkaz vypršal|Odkaz bol zrušený|Príliš veľa požiadaviek/,
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('body')).toContainText(
      /HTTP 410|neplatný|požiadaviek/i,
    )
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
