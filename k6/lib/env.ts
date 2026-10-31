/**
 * Shared k6 env helpers.
 * Override with: BASE_URL=https://… k6 run k6/load.ts
 */
export const BASE_URL = String(
  __ENV.BASE_URL || 'http://127.0.0.1:3000',
).replace(/\/$/, '')

export function url(path: string): string {
  if (!path.startsWith('/')) return `${BASE_URL}/${path}`
  return `${BASE_URL}${path}`
}
