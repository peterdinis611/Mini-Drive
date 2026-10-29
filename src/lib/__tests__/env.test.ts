import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEYS = [
  'NODE_ENV',
  'npm_lifecycle_event',
  'APP_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'UPLOADTHING_TOKEN',
  'DATABASE_URL',
] as const

describe('assertProductionEnv', () => {
  const snapshot = new Map<string, string | undefined>()

  beforeEach(() => {
    for (const key of KEYS) {
      snapshot.set(key, process.env[key])
    }
  })

  afterEach(() => {
    for (const key of KEYS) {
      const value = snapshot.get(key)
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    vi.resetModules()
  })

  it('no-ops outside production', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.APP_URL
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).not.toThrow()
  })

  it('no-ops during vite/pnpm build lifecycle', async () => {
    process.env.NODE_ENV = 'production'
    process.env.npm_lifecycle_event = 'build'
    delete process.env.APP_URL
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).not.toThrow()
  })

  it('requires critical vars in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.npm_lifecycle_event = 'start'
    for (const key of KEYS) {
      if (key === 'NODE_ENV' || key === 'npm_lifecycle_event') continue
      delete process.env[key]
    }
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).toThrow(/Production requires/)
  })

  it('rejects localhost APP_URL in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.npm_lifecycle_event = 'start'
    process.env.APP_URL = 'https://localhost:3000'
    process.env.CLERK_SECRET_KEY = 'sk_live_x'
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.UPLOADTHING_TOKEN = 'tok'
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@db:5432/mini_drive'
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).toThrow(/localhost/)
  })

  it('rejects non-postgres DATABASE_URL in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.npm_lifecycle_event = 'start'
    process.env.APP_URL = 'https://drive.example.com'
    process.env.CLERK_SECRET_KEY = 'sk_live_x'
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.UPLOADTHING_TOKEN = 'tok'
    process.env.DATABASE_URL = 'dev.db'
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).toThrow(/postgresql/)
  })

  it('accepts a complete production env', async () => {
    process.env.NODE_ENV = 'production'
    process.env.npm_lifecycle_event = 'start'
    process.env.APP_URL = 'https://drive.example.com'
    process.env.CLERK_SECRET_KEY = 'sk_live_x'
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_live_x'
    process.env.UPLOADTHING_TOKEN = 'tok'
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@db:5432/mini_drive'
    const { assertProductionEnv } = await import('#/lib/env')
    expect(() => assertProductionEnv()).not.toThrow()
  })
})
