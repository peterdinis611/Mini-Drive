import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEYS = [
  'NODE_ENV',
  'npm_lifecycle_event',
  'BACKUP_ENCRYPTION_KEY',
  'REDIS_URL',
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
    delete process.env.BACKUP_ENCRYPTION_KEY
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    expect(write).not.toHaveBeenCalled()
  })

  it('warns when optional prod secrets are missing', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.BACKUP_ENCRYPTION_KEY
    delete process.env.REDIS_URL
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    const joined = write.mock.calls.map((c) => String(c[0])).join('\n')
    expect(joined).toContain('BACKUP_ENCRYPTION_KEY')
    expect(joined).toContain('REDIS_URL')
  })

  it('stays quiet when optional secrets are set', async () => {
    process.env.NODE_ENV = 'production'
    process.env.BACKUP_ENCRYPTION_KEY = 'at-least-16-chars'
    process.env.REDIS_URL = 'redis://127.0.0.1:6379'
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)
    const { warnOptionalProductionEnv } = await import('#/lib/env')
    warnOptionalProductionEnv()
    expect(write).not.toHaveBeenCalled()
  })
})
