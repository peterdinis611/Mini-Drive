import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('landing accessibility basics', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('has a single main landmark and one h1', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test('primary CTAs are keyboard-focusable', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Začať nahrávať zadarmo/i })
    await cta.focus()
    await expect(cta).toBeFocused()
  })

  test('images that convey UI have accessible names or are decorative', async ({
    page,
  }) => {
    await page.goto('/')
    const imgs = page.locator('img')
    const count = await imgs.count()
    for (let i = 0; i < count; i += 1) {
      const img = imgs.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaHidden = await img.getAttribute('aria-hidden')
      const role = await img.getAttribute('role')
      const ok =
        alt !== null ||
        ariaHidden === 'true' ||
        role === 'presentation' ||
        role === 'none'
      expect(ok, `img[${i}] needs alt or decorative attrs`).toBeTruthy()
    }
  })

  test('collage region is labeled', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('region', { name: /Ukážka archívu/i }),
    ).toBeVisible()
  })
})
