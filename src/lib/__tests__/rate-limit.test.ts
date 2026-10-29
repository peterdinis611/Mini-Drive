import { beforeEach, describe, expect, it } from 'vitest'

import { checkRateLimit, resetRateLimitStore } from '../rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('allows requests under the limit', () => {
    const first = checkRateLimit('ip:1', { limit: 2, windowMs: 60_000 })
    const second = checkRateLimit('ip:1', { limit: 2, windowMs: 60_000 })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
  })

  it('blocks when the limit is exceeded', () => {
    checkRateLimit('ip:2', { limit: 1, windowMs: 60_000 })
    const blocked = checkRateLimit('ip:2', { limit: 1, windowMs: 60_000 })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0)
    }
  })

  it('tracks remaining and isolates keys', () => {
    const first = checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(first.ok).toBe(true)
    if (first.ok) expect(first.remaining).toBe(2)

    const other = checkRateLimit('user:b', { limit: 1, windowMs: 60_000 })
    expect(other.ok).toBe(true)

    checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    const third = checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(third.ok).toBe(true)
    if (third.ok) expect(third.remaining).toBe(0)

    const blocked = checkRateLimit('user:a', { limit: 3, windowMs: 60_000 })
    expect(blocked.ok).toBe(false)
  })
})
