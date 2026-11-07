import { expect, test } from '@playwright/test'

test.describe('document meta + head chrome', () => {
  test('landing exposes description, twitter card, and json-ld', async ({
    request,
  }) => {
    const res = await request.get('/')
    expect(res.ok()).toBeTruthy()
    const html = await res.text()
    expect(html).toMatch(/name=["']description["']/i)
    expect(html).toMatch(/name=["']twitter:card["']/i)
    expect(html).toMatch(/summary_large_image/i)
    expect(html).toMatch(/application\/ld\+json/i)
    expect(html).toMatch(/"@type"\s*:\s*"WebSite"/)
    expect(html).toMatch(/rel=["']manifest["']/i)
    expect(html).toMatch(/href=["']\/site\.webmanifest["']/i)
  })

  test('html document declares Slovak language', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', /sk/i)
  })

  test('sign-in stays indexable public auth surface', async ({ request }) => {
    const res = await request.get('/sign-in')
    expect(res.ok()).toBeTruthy()
    const html = await res.text()
    // Public auth paths are Allow: in robots.txt — page should not force noindex.
    expect(html).not.toMatch(/content=["']noindex/i)
    expect(html).toMatch(/name=["']robots["']/i)
  })

  test('theme-color meta is present', async ({ request }) => {
    const res = await request.get('/')
    const html = await res.text()
    expect(html).toMatch(/name=["']theme-color["']/i)
    // SSR currently emits at least the dark media variant (+ color-scheme).
    expect(html).toMatch(/prefers-color-scheme:\s*dark/i)
    expect(html).toMatch(/name=["']color-scheme["']/i)
  })

  test('share gone page is noindex', async ({ request }) => {
    const health = await request.get('/api/health')
    test.skip(health.status() !== 200, 'Postgres required for share resolve')
    const res = await request.get('/s/e2e-meta-missing-token')
    expect([200, 410, 429]).toContain(res.status())
    const html = await res.text()
    expect(html).toMatch(/noindex/i)
  })
})
