import { describe, expect, it } from 'vitest'

import {
  formatIpFingerprint,
  normalizeAuditIp,
  truncateUserAgent,
} from '#/lib/share-audit'
import { hashAuditIp } from '#/lib/share-audit-hash'
import { CREATE_SHARE_RATE_LIMIT, SHARE_ACCESS_LOG_LIMIT } from '#/lib/constants'

describe('truncateUserAgent', () => {
  it('returns null for empty', () => {
    expect(truncateUserAgent(null)).toBeNull()
    expect(truncateUserAgent('   ')).toBeNull()
  })

  it('keeps short agents', () => {
    expect(truncateUserAgent('Mozilla/5.0')).toBe('Mozilla/5.0')
  })

  it('truncates long agents with ellipsis', () => {
    const long = 'x'.repeat(300)
    const result = truncateUserAgent(long, 50)
    expect(result).not.toBeNull()
    expect(result!.length).toBe(50)
    expect(result!.endsWith('…')).toBe(true)
  })
})

describe('normalizeAuditIp', () => {
  it('falls back to unknown', () => {
    expect(normalizeAuditIp(null)).toBe('unknown')
    expect(normalizeAuditIp('')).toBe('unknown')
  })

  it('keeps and trims ip', () => {
    expect(normalizeAuditIp(' 1.2.3.4 ')).toBe('1.2.3.4')
  })
})

describe('hashAuditIp', () => {
  it('returns unknown for empty', () => {
    expect(hashAuditIp(null, 'pepper')).toBe('unknown')
  })

  it('is deterministic and not the raw IP', () => {
    const a = hashAuditIp('1.2.3.4', 'test-pepper-secret')
    const b = hashAuditIp('1.2.3.4', 'test-pepper-secret')
    expect(a).toBe(b)
    expect(a).not.toContain('1.2.3.4')
    expect(a).toHaveLength(32)
  })

  it('changes with pepper', () => {
    expect(hashAuditIp('1.2.3.4', 'a'.repeat(16))).not.toBe(
      hashAuditIp('1.2.3.4', 'b'.repeat(16)),
    )
  })

  it('requires a pepper when hashing a real IP', () => {
    expect(() => hashAuditIp('1.2.3.4', '')).toThrow(
      /CLERK_SECRET_KEY|AUDIT_IP_PEPPER/,
    )
  })
})

describe('formatIpFingerprint', () => {
  it('shortens long hashes', () => {
    expect(formatIpFingerprint('abcdef0123456789abcdef0123456789')).toBe(
      'abcdef01…6789',
    )
  })

  it('handles unknown', () => {
    expect(formatIpFingerprint('unknown')).toBe('neznámy')
  })
})

describe('create-share rate limit constants', () => {
  it('limits creates more tightly than public resolve', () => {
    expect(CREATE_SHARE_RATE_LIMIT.limit).toBe(10)
    expect(CREATE_SHARE_RATE_LIMIT.windowMs).toBe(60_000)
    expect(SHARE_ACCESS_LOG_LIMIT).toBe(50)
  })
})
