import { describe, expect, it } from 'vitest'

import { hashAuditIp } from '#/lib/share-audit-hash'

describe('hashAuditIp', () => {
  it('returns unknown for empty / unknown IPs', () => {
    expect(hashAuditIp(null, 'pepper')).toBe('unknown')
    expect(hashAuditIp(undefined, 'pepper')).toBe('unknown')
    expect(hashAuditIp('', 'pepper')).toBe('unknown')
    expect(hashAuditIp('unknown', 'pepper')).toBe('unknown')
  })

  it('is stable for the same IP + pepper', () => {
    const a = hashAuditIp('203.0.113.10', 'secret-pepper')
    const b = hashAuditIp('203.0.113.10', 'secret-pepper')
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{32}$/)
  })

  it('changes when pepper or IP changes', () => {
    const base = hashAuditIp('203.0.113.10', 'pepper-a')
    expect(hashAuditIp('203.0.113.11', 'pepper-a')).not.toBe(base)
    expect(hashAuditIp('203.0.113.10', 'pepper-b')).not.toBe(base)
  })

  it('throws when pepper is missing', () => {
    expect(() => hashAuditIp('203.0.113.10', '')).toThrow(/chýba/)
  })
})
