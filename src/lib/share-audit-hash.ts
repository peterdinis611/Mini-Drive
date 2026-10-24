import { createHmac } from 'node:crypto'

import { normalizeAuditIp } from '#/lib/share-audit'

/**
 * HMAC-SHA256 fingerprint of an IP (truncated hex).
 * Same IP + pepper → same hash (correlation); not reversible without pepper.
 * Server-only — do not import from client components.
 */
export function hashAuditIp(
  ip: string | null | undefined,
  pepper: string,
): string {
  const normalized = normalizeAuditIp(ip)
  if (normalized === 'unknown') return 'unknown'
  if (!pepper) {
    throw new Error('AUDIT_IP_PEPPER / BETTER_AUTH_SECRET chýba pre hash IP')
  }
  return createHmac('sha256', pepper)
    .update(normalized)
    .digest('hex')
    .slice(0, 32)
}
