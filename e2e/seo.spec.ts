import { expect, test } from '@playwright/test'

test.describe('seo endpoints', () => {
  test('robots.txt allows public paths and blocks private ones', async ({
    request,
  }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Allow: /')
    expect(body).toContain('Allow: /sign-in')
    expect(body).toContain('Disallow: /files')
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain('Disallow: /s/')
    expect(body).toMatch(/Sitemap:\s+\S+\/sitemap\.xml/)
  })

  test('sitemap.xml lists public URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBeTruthy()
    expect(res.headers()['content-type'] ?? '').toMatch(/xml/)
    const body = await res.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('/sign-in')
    expect(body).toContain('/sign-up')
    expect(body).not.toContain('/files')
  })

  test('favicon.svg is served', async ({ request }) => {
    const res = await request.get('/favicon.svg')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toMatch(/<svg/i)
  })

  test('og.svg is served for social previews', async ({ request }) => {
    const res = await request.get('/og.svg')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toMatch(/<svg/i)
  })

  test('landing HTML includes canonical / Open Graph hints', async ({
    request,
  }) => {
    const res = await request.get('/')
    expect(res.ok()).toBeTruthy()
    const html = await res.text()
    expect(html).toMatch(/rel=["']canonical["']/i)
    expect(html).toMatch(/property=["']og:title["']/i)
    expect(html).toMatch(/Mini Drive/i)
  })
})
