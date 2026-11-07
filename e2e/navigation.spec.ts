import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('public navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('landing Prihlásenie opens sign-in', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Prihlásenie' }).click()
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 })
  })

  test('landing Začať opens sign-up', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Začať', exact: true }).click()
    await expect(page).toHaveURL(/\/sign-up/, { timeout: 15_000 })
  })

  test('brand mark from sign-in returns home', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByRole('link', { name: /Mini Drive/i }).click()
    await expect(page).toHaveURL(/\/(?:$|\?)/, { timeout: 15_000 })
  })

  test('404 Domov CTA returns to landing', async ({ page }) => {
    await page.goto('/e2e-nav-missing-path')
    await expect(
      page.getByRole('heading', { name: /Táto cesta v archíve nie je/i }),
    ).toBeVisible({ timeout: 15_000 })
    await page.getByRole('link', { name: 'Domov' }).click()
    await expect(page).toHaveURL(/\/(?:$|\?|#)/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('how-it-works nav jumps to #ako', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Sekcie stránky' })
      .getByRole('link', { name: 'Ako', exact: true })
      .click()
    await expect(page).toHaveURL(/\/#ako/)
    await expect(page.locator('#ako')).toBeVisible()
  })
})
