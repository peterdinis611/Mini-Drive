import { expect, test } from '@playwright/test'

test.describe('security headers', () => {
  test('landing response carries baseline hardening headers', async ({
    request,
  }) => {
    const res = await request.get('/')
    expect(res.ok()).toBeTruthy()
    const headers = res.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy'] ?? '').toMatch(/camera=\(\)/)
    expect(headers['content-security-policy'] ?? '').toMatch(/default-src/)
    expect(headers['content-security-policy'] ?? '').toMatch(
      /frame-ancestors 'none'/,
    )
  })

  test('health endpoint also sets nosniff + CSP', async ({ request }) => {
    const res = await request.get('/api/health')
    expect([200, 503]).toContain(res.status())
    const headers = res.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['content-security-policy'] ?? '').toMatch(/default-src/)
  })

  test('share gone response is not publicly cacheable', async ({ request }) => {
    const res = await request.get('/s/e2e-security-missing-token')
    expect([200, 410, 429, 503]).toContain(res.status())
    const cache = res.headers()['cache-control'] ?? ''
    // Dev may omit Cache-Control (http-cache only in production); when present it must not be public.
    if (cache) {
      expect(cache).not.toMatch(/public/i)
      expect(cache).toMatch(/no-store|private|no-cache/i)
    }
  })
})
