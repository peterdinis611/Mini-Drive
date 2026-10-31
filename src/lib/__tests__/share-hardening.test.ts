import { beforeEach, describe, expect, it } from 'vitest'

import {
  MAX_ACTIVE_SHARES_PER_USER,
  SHARE_DEFAULT_EXPIRES_IN,
  SHARE_EXPIRY_PRESETS,
  SHARE_PASSWORD_TOKEN_LOCK,
  SHARE_SIGNED_URL_TTL_SECONDS,
} from '#/lib/constants'
import {
  checkRateLimit,
  clearRateLimit,
  peekRateLimit,
  recordRateLimitHit,
  resetRateLimitStore,
} from '#/lib/rate-limit'
import { createShareLinkSchema } from '#/lib/validation'

describe('share hardening constants', () => {
  it('defaults to the shortest expiry preset (not forever)', () => {
    expect(SHARE_DEFAULT_EXPIRES_IN).toBe(SHARE_EXPIRY_PRESETS[0].value)
    expect(SHARE_DEFAULT_EXPIRES_IN).toBe(15 * 60)
    expect(SHARE_EXPIRY_PRESETS.every((preset) => preset.value > 0)).toBe(true)
  })

  it('keeps signed CDN URLs short-lived', () => {
    expect(SHARE_SIGNED_URL_TTL_SECONDS).toBe(300)
  })

  it('caps concurrent active shares per user', () => {
    expect(MAX_ACTIVE_SHARES_PER_USER).toBeGreaterThan(0)
    expect(MAX_ACTIVE_SHARES_PER_USER).toBeLessThanOrEqual(100)
  })
})

describe('createShareLinkSchema password requirement', () => {
  const fileId = '550e8400-e29b-41d4-a716-446655440000'

  it('rejects shares without a password', () => {
    expect(() =>
      createShareLinkSchema.parse({
        fileId,
        expiresIn: SHARE_DEFAULT_EXPIRES_IN,
      }),
    ).toThrow()
  })

  it('accepts password + preset expiry', () => {
    expect(
      createShareLinkSchema.parse({
        fileId,
        expiresIn: SHARE_DEFAULT_EXPIRES_IN,
        password: 'tajne12',
      }),
    ).toMatchObject({ password: 'tajne12' })
  })
})

describe('share password token lock window', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('locks a token after SHARE_PASSWORD_TOKEN_LOCK.limit failures', async () => {
    const key = 'share-pw-fail:tok_unit'
    for (let i = 0; i < SHARE_PASSWORD_TOKEN_LOCK.limit; i += 1) {
      const hit = await recordRateLimitHit(key, SHARE_PASSWORD_TOKEN_LOCK)
      expect(hit.ok).toBe(true)
    }
    const locked = await recordRateLimitHit(key, SHARE_PASSWORD_TOKEN_LOCK)
    expect(locked.ok).toBe(false)
    expect((await peekRateLimit(key, SHARE_PASSWORD_TOKEN_LOCK)).ok).toBe(false)

    await clearRateLimit(key)
    expect((await peekRateLimit(key, SHARE_PASSWORD_TOKEN_LOCK)).ok).toBe(true)
  })

  it('does not consume the lock when only peeking', async () => {
    const key = 'share-pw-fail:peek'
    for (let i = 0; i < 3; i += 1) {
      expect((await peekRateLimit(key, SHARE_PASSWORD_TOKEN_LOCK)).ok).toBe(
        true,
      )
    }
    const first = await checkRateLimit(key, { limit: 1, windowMs: 60_000 })
    expect(first.ok).toBe(true)
  })
})
