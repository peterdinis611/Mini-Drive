import { describe, expect, it, beforeEach } from 'vitest'

import { checkRateLimit, resetRateLimitStore } from './rate-limit'

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
})
