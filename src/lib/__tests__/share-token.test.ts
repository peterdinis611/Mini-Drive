import { describe, expect, it } from 'vitest'

import {
  buildSharePath,
  generateShareToken,
  resolveShareStatus,
} from '../share-token'

describe('generateShareToken', () => {
  it('returns unique url-safe tokens', () => {
    const a = generateShareToken()
    const b = generateShareToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(a.length).toBeGreaterThanOrEqual(32)
  })
})

describe('buildSharePath', () => {
  it('prefixes the public route', () => {
    expect(buildSharePath('abc')).toBe('/s/abc')
  })
})

describe('resolveShareStatus', () => {
  it('classifies active, expired, and revoked links', () => {
    expect(
      resolveShareStatus({
        expiresAt: Date.now() + 60_000,
        revokedAt: null,
      }),
    ).toBe('active')

    expect(
      resolveShareStatus({
        expiresAt: Date.now() - 1,
        revokedAt: null,
      }),
    ).toBe('expired')

    expect(
      resolveShareStatus({
        expiresAt: Date.now() + 60_000,
        revokedAt: Date.now(),
      }),
    ).toBe('revoked')
  })

  it('accepts Date instances for expiry and revoke', () => {
    expect(
      resolveShareStatus({
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      }),
    ).toBe('active')

    expect(
      resolveShareStatus({
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      }),
    ).toBe('revoked')
  })

  it('prefers revoked over expired', () => {
    expect(
      resolveShareStatus({
        expiresAt: Date.now() - 1,
        revokedAt: Date.now(),
      }),
    ).toBe('revoked')
  })
})
