import type { APIRequestContext } from '@playwright/test'

/** True when `/api/health` reports healthy Postgres. */
export async function postgresReady(
  request: APIRequestContext,
): Promise<boolean> {
  const res = await request.get('/api/health')
  if (res.status() !== 200) return false
  const body = (await res.json()) as { status?: string }
  return body.status === 'ok'
}
