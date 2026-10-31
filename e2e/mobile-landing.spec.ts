import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('mobile landing', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('hero and CTAs remain usable on a phone viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Začať nahrávať zadarmo/i }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Prihlásenie' })).toBeVisible()
  })

  test('privacy section is reachable via in-page nav', async ({ page }) => {
    await page.goto('/')
    const privacyNav = page
      .getByRole('navigation', { name: 'Sekcie stránky' })
      .getByRole('link', { name: 'Súkromie' })
    await expect(privacyNav).toBeVisible()
    await privacyNav.click()
    await expect(page.locator('#sukromie')).toBeVisible()
  })
})
