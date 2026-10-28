import { describe, expect, it } from 'vitest'

import {
  SHARE_EXPIRY_PRESETS,
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
  })
})
