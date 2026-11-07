import { expect, test } from '@playwright/test'

test.describe('public HTTP API surface', () => {
  test('health survives non-GET without 5xx', async ({ request }) => {
    const res = await request.fetch('/api/health', { method: 'PUT' })
    // Router may 404/405 or still answer — never crash the process.
    expect(res.status()).toBeLessThan(500)
  })

  test('uploadthing GET does not crash the process', async ({ request }) => {
    const res = await request.get('/api/uploadthing')
    expect(res.status()).toBeLessThan(500)
  })

  test('unknown /api path is not a 5xx', async ({ request }) => {
    const res = await request.get('/api/e2e-does-not-exist')
    expect(res.status()).toBeLessThan(500)
    expect([404, 405, 400]).toContain(res.status())
  })

  test('health responds quickly under sequential calls', async ({
    request,
  }) => {
    const started = Date.now()
    for (let i = 0; i < 5; i += 1) {
      const res = await request.get('/api/health')
      expect([200, 503]).toContain(res.status())
    }
    expect(Date.now() - started).toBeLessThan(15_000)
  })
})
