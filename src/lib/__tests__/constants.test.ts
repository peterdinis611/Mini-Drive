import { describe, expect, it } from 'vitest'

import {
  MAX_ACTIVE_SHARES_PER_USER,
  SHARE_DEFAULT_EXPIRES_IN,
  SHARE_EXPIRY_PRESETS,
  SHARE_PASSWORD_TOKEN_LOCK,
  SHARE_SIGNED_URL_TTL_SECONDS,
  STORAGE_QUOTA_BYTES,
  TRASH_RETENTION_DAYS,
  UPLOAD_LIMITS,
} from '#/lib/constants'

describe('storage + trash constants', () => {
  it('defines a 100 GB hard quota', () => {
    expect(STORAGE_QUOTA_BYTES).toBe(100 * 1024 ** 3)
  })

  it('keeps trash for 30 days', () => {
    expect(TRASH_RETENTION_DAYS).toBe(30)
  })
})

describe('upload limits', () => {
  it('caps size and count', () => {
    expect(UPLOAD_LIMITS.maxFileCount).toBe(10)
    expect(UPLOAD_LIMITS.maxFileSizeBytes).toBe(32 * 1024 * 1024)
  })
})

describe('share presets', () => {
  it('exposes positive expiry presets and short signed TTL', () => {
    expect(SHARE_EXPIRY_PRESETS.length).toBeGreaterThan(0)
    for (const preset of SHARE_EXPIRY_PRESETS) {
      expect(preset.value).toBeGreaterThan(0)
      expect(preset.label.length).toBeGreaterThan(0)
    }
    expect(SHARE_SIGNED_URL_TTL_SECONDS).toBe(5 * 60)
    expect(SHARE_DEFAULT_EXPIRES_IN).toBe(SHARE_EXPIRY_PRESETS[0].value)
    expect(MAX_ACTIVE_SHARES_PER_USER).toBe(25)
    expect(SHARE_PASSWORD_TOKEN_LOCK.limit).toBe(5)
  })
})
