import { beforeEach, describe, expect, it } from 'vitest'

import {
  checkRateLimit,
  clearRateLimit,
  peekRateLimit,
  recordRateLimitHit,
  resetRateLimitStore,
} from '../rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('allows requests under the limit', async () => {
    const first = await checkRateLimit('ip:1', { limit: 2, windowMs: 60_000 })
    const second = await checkRateLimit('ip:1', { limit: 2, windowMs: 60_000 })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
  })

  it('blocks when the limit is exceeded', async () => {
    await checkRateLimit('ip:2', { limit: 1, windowMs: 60_000 })
    const blocked = await checkRateLimit('ip:2', { limit: 1, windowMs: 60_000 })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0)
    }
  })

  it('tracks remaining and isolates keys', async () => {
    const first = await checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(first.ok).toBe(true)
    if (first.ok) expect(first.remaining).toBe(2)

    const other = await checkRateLimit('user:b', { limit: 1, windowMs: 60_000 })
    expect(other.ok).toBe(true)

    await checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    const third = await checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(third.ok).toBe(true)
    if (third.ok) expect(third.remaining).toBe(0)

    const blocked = await checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(blocked.ok).toBe(false)
  })
})

describe('peek / record / clear', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('peeks without consuming, records fails, then clears', async () => {
    expect(
      (await peekRateLimit('token:1', { limit: 2, windowMs: 60_000 })).ok,
    ).toBe(true)

    const firstFail = await recordRateLimitHit('token:1', {
      limit: 2,
      windowMs: 60_000,
    })
    expect(firstFail.ok).toBe(true)

    expect(
      (await peekRateLimit('token:1', { limit: 2, windowMs: 60_000 })).ok,
    ).toBe(true)

    const secondFail = await recordRateLimitHit('token:1', {
      limit: 2,
      windowMs: 60_000,
    })
    expect(secondFail.ok).toBe(true)

    const locked = await recordRateLimitHit('token:1', {
      limit: 2,
      windowMs: 60_000,
    })
    expect(locked.ok).toBe(false)

    await clearRateLimit('token:1')
    expect(
      (await peekRateLimit('token:1', { limit: 2, windowMs: 60_000 })).ok,
    ).toBe(true)
  })
})
