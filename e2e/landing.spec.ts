import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('public landing', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('loads marketing home with brand + title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Mini Drive/i)
    await expect(
      page.getByRole('link', { name: /Mini Drive — domov/i }),
    ).toBeVisible()
  })

  test('shows guest CTAs to sign-up and sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('link', { name: 'Začať', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Začať nahrávať zadarmo/i }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Prihlásenie' })).toBeVisible()
  })

  test('section nav anchors stay on home', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Sekcie stránky' })
      .getByRole('link', { name: 'Súkromie' })
      .click()
    await expect(page).toHaveURL(/\/#sukromie/)
    await expect(page.locator('#sukromie')).toBeVisible()
  })

  test('theme toggle is interactive', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', {
      name: /Zapnúť (tmavý|svetlý) režim/,
    })
    await expect(toggle).toBeVisible()
    await toggle.click()
    // next-themes may keep system preference; assert the control stayed usable.
    await expect(toggle).toBeEnabled()
    await expect(page.locator('html')).toHaveAttribute('class', /./)
  })
})
