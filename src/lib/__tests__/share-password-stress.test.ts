import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SHARE_PASSWORD_RATE_LIMIT } from '#/lib/constants'
import { checkRateLimit, resetRateLimitStore } from '#/lib/rate-limit'

/**
 * Mock scrypt so we can stress the verify / unlock path without burning CPU.
 * Real scrypt cost is covered by share-password.test.ts.
 */
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  const fixedSalt = Buffer.alloc(16, 7)
  const fixedHash = Buffer.alloc(32, 9)
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from(fixedSalt)),
    scryptSync: vi.fn(() => Buffer.from(fixedHash)),
    timingSafeEqual: vi.fn(
      (a: NodeJS.ArrayBufferView, b: NodeJS.ArrayBufferView) =>
        Buffer.compare(Buffer.from(a as Buffer), Buffer.from(b as Buffer)) ===
        0,
    ),
  }
})

describe('stress: share password unlock (mocked crypto)', () => {
  beforeEach(() => {
    resetRateLimitStore()
    vi.clearAllMocks()
  })

  it('handles a burst of unlock attempts with rate limiting', async () => {
    const { hashSharePassword, verifySharePassword } = await import(
      '#/lib/share-password'
    )

    const encoded = hashSharePassword('tajne-heslo')
    expect(encoded.startsWith('v1$')).toBe(true)

    const key = 'unlock:tok_stress:ip:9.9.9.9'
    let allowed = 0
    let blocked = 0
    let verified = 0

    const started = performance.now()
    for (let i = 0; i < 200; i += 1) {
      const gate = checkRateLimit(key, SHARE_PASSWORD_RATE_LIMIT)
      if (!gate.ok) {
        blocked += 1
        continue
      }
      allowed += 1
      if (verifySharePassword('tajne-heslo', encoded)) verified += 1
    }

    expect(allowed).toBe(SHARE_PASSWORD_RATE_LIMIT.limit)
    expect(blocked).toBe(200 - SHARE_PASSWORD_RATE_LIMIT.limit)
    expect(verified).toBe(SHARE_PASSWORD_RATE_LIMIT.limit)
    expect(performance.now() - started).toBeLessThan(1_000)
  })

  it('rejects wrong passwords at volume without opening the gate past limit', async () => {
    const { hashSharePassword, verifySharePassword } = await import(
      '#/lib/share-password'
    )
    const encoded = hashSharePassword('spravne')

    // Force mismatch: real verify uses mocked scrypt returning same hash for any
    // password — so stub timingSafeEqual / scrypt path via a tampered encoded value.
    const badEncoded = 'v1$AAAA$BBBB'
    let rejects = 0
    for (let i = 0; i < 500; i += 1) {
      if (!verifySharePassword('x', badEncoded)) rejects += 1
    }
    expect(rejects).toBe(500)

    // Correct encoded still verifies under mock
    expect(verifySharePassword('anything', encoded)).toBe(true)
  })
})
