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

/** Positive int from env, or fallback. */
export function envInt(name: string, fallback: number): number {
  const raw = __ENV[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number.parseInt(String(raw), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Duration string from env (`30s`, `5m`), or fallback. */
export function envDuration(name: string, fallback: string): string {
  const raw = __ENV[name]
  if (raw === undefined || raw === '') return fallback
  return String(raw)
}
