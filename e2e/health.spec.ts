import { expect, test } from '@playwright/test'

test.describe('health API', () => {
  test('GET /api/health reports status without crashing', async ({
    request,
  }) => {
    const res = await request.get('/api/health')
    expect([200, 503]).toContain(res.status())
    expect(res.headers()['cache-control'] ?? '').toMatch(/no-store/)
    const body = await res.json()
    expect(['ok', 'degraded']).toContain(body.status)
    expect(body.checks).toHaveProperty('database')
    expect(typeof body.uptimeSec).toBe('number')
    expect(typeof body.durationMs).toBe('number')
  })

  test('healthy response includes database ok', async ({ request }) => {
    const res = await request.get('/api/health')
    test.skip(res.status() !== 200, 'Postgres unavailable in this environment')
    const body = await res.json()
    expect(body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok' },
    })
  })

  test('responds with JSON content-type', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/)
  })

  test('degraded payload still has checks.database when DB is down', async ({
    request,
  }) => {
    const res = await request.get('/api/health')
    test.skip(res.status() === 200, 'DB is healthy in this environment')
    expect(res.status()).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.database).not.toBe('ok')
  })
})
