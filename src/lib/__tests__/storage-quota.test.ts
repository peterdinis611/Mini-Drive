import { describe, expect, it } from 'vitest'

import { STORAGE_QUOTA_BYTES } from '#/lib/constants'
import {
  checkStorageQuota,
  formatStorageBytes,
  projectStorageUsage,
  remainingStorageBytes,
} from '#/lib/storage-quota'

describe('formatStorageBytes', () => {
  it('formats B / KB / MB / GB', () => {
    expect(formatStorageBytes(500)).toBe('500 B')
    expect(formatStorageBytes(2048)).toBe('2.0 KB')
    expect(formatStorageBytes(3 * 1024 ** 2)).toBe('3.0 MB')
    expect(formatStorageBytes(1.5 * 1024 ** 3)).toBe('1.50 GB')
  })
})

describe('projectStorageUsage', () => {
  it('adds incoming bytes to used', () => {
    expect(
      projectStorageUsage({ usedBytes: 100, additionalBytes: 40 }),
    ).toBe(140)
  })

  it('subtracts releasing bytes (replace flow)', () => {
    expect(
      projectStorageUsage({
        usedBytes: 1000,
        additionalBytes: 200,
        releasingBytes: 300,
      }),
    ).toBe(900)
  })
})

describe('remainingStorageBytes', () => {
  it('returns leftover under quota', () => {
    expect(
      remainingStorageBytes({
        usedBytes: STORAGE_QUOTA_BYTES - 100,
      }),
    ).toBe(100)
  })

  it('never goes negative', () => {
    expect(
      remainingStorageBytes({
        usedBytes: STORAGE_QUOTA_BYTES + 50,
      }),
    ).toBe(0)
  })
})

describe('checkStorageQuota', () => {
  it('allows upload under quota', () => {
    expect(
      checkStorageQuota({
        usedBytes: 100,
        additionalBytes: 50,
        quotaBytes: 200,
      }),
    ).toEqual({ ok: true })
  })

  it('allows exact fill', () => {
    expect(
      checkStorageQuota({
        usedBytes: 150,
        additionalBytes: 50,
        quotaBytes: 200,
      }),
    ).toEqual({ ok: true })
  })

  it('rejects overflow with remaining message', () => {
    const result = checkStorageQuota({
      usedBytes: 180,
      additionalBytes: 50,
      quotaBytes: 200,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.remainingBytes).toBe(20)
      expect(result.message).toContain('Nedostatok miesta')
      expect(result.message).toContain('20 B')
    }
  })

  it('replace can succeed when new file is larger but net stays under quota', () => {
    expect(
      checkStorageQuota({
        usedBytes: 190,
        additionalBytes: 30,
        releasingBytes: 20,
        quotaBytes: 200,
      }),
    ).toEqual({ ok: true })
  })

  it('replace fails when net still overflows', () => {
    const result = checkStorageQuota({
      usedBytes: 190,
      additionalBytes: 50,
      releasingBytes: 10,
      quotaBytes: 200,
    })
    expect(result.ok).toBe(false)
  })
})
