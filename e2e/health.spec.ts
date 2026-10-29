import { expect, test } from '@playwright/test'

test.describe('health API', () => {
  test('GET /api/health returns ok when database is up', async ({
    request,
  }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control'] ?? '').toMatch(/no-store/)
    const body = await res.json()
    expect(body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok' },
    })
    expect(typeof body.uptimeSec).toBe('number')
    expect(typeof body.durationMs).toBe('number')
  })
})
