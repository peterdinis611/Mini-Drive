/** Truncate User-Agent for storage (privacy + row size). */
export function truncateUserAgent(
  value: string | null | undefined,
  max = 240,
): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

/** Normalize IP for audit (never empty). */
export function normalizeAuditIp(ip: string | null | undefined): string {
  const value = ip?.trim()
  return value && value.length > 0 ? value.slice(0, 64) : 'unknown'
}

/** Short display form for the UI (never the raw IP). */
export function formatIpFingerprint(hash: string): string {
  if (!hash || hash === 'unknown') return 'neznámy'
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}
