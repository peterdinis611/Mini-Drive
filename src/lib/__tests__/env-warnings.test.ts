import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEYS = [
  'NODE_ENV',
  'npm_lifecycle_event',
  'AUDIT_IP_PEPPER',
  'BACKUP_ENCRYPTION_KEY',
] as const

describe('warnOptionalProductionEnv', () => {
  const snapshot = new Map<string, string | undefined>()

  beforeEach(() => {
    for (const key of KEYS) snapshot.set(key, process.env[key])
  })

  afterEach(() => {
    for (const key of KEYS) {
      const value = snapshot.get(key)
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('is quiet outside production', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.AUDIT_IP_PEPPER
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when optional prod secrets are missing', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.AUDIT_IP_PEPPER
    delete process.env.BACKUP_ENCRYPTION_KEY
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('AUDIT_IP_PEPPER')),
    ).toBe(true)
    expect(
      warn.mock.calls.some((c) =>
        String(c[0]).includes('BACKUP_ENCRYPTION_KEY'),
      ),
    ).toBe(true)
  })

  it('stays quiet when optional secrets are set', async () => {
    process.env.NODE_ENV = 'production'
    process.env.AUDIT_IP_PEPPER = 'pepper'
    process.env.BACKUP_ENCRYPTION_KEY = 'at-least-16-chars'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    expect(warn).not.toHaveBeenCalled()
  })
})
