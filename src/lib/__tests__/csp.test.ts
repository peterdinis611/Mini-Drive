import { describe, expect, it } from 'vitest'
import { AUTH_LIMITS } from '#/lib/constants'
import { buildContentSecurityPolicy } from '#/lib/csp'

describe('buildContentSecurityPolicy', () => {
  it('sets a strict production policy', () => {
    const csp = buildContentSecurityPolicy('production')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).toContain('https://fonts.googleapis.com')
    expect(csp).toContain('https://*.ufs.sh')
    expect(csp).toContain('https://*.clerk.accounts.dev')
    expect(csp).toContain('https://img.clerk.com')
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it('relaxes script/connect for Vite HMR in development', () => {
    const csp = buildContentSecurityPolicy('development')
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain('ws://localhost:*')
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  it('keeps production-like rules for test env', () => {
    const csp = buildContentSecurityPolicy('test')
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toContain('ws://localhost:*')
  })
})

describe('AUTH_LIMITS password floor', () => {
  it('requires at least 12 characters for new passwords', () => {
    expect(AUTH_LIMITS.passwordMin).toBe(12)
  })
})
