import { afterEach, describe, expect, it } from 'vitest'

describe('cacheControlForPath', () => {
  const original = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = original
  })

  it('is inactive outside production', async () => {
    process.env.NODE_ENV = 'development'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/assets/app-abcdef.js')).toBeNull()
  })

  it('marks hashed vite assets immutable', async () => {
    process.env.NODE_ENV = 'production'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/assets/file-explorer-B0Hga5Su.js')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(cacheControlForPath('/assets/styles-a1b2c3d4.css')).toContain(
      'immutable',
    )
  })

  it('long-caches marketing and icons', async () => {
    process.env.NODE_ENV = 'production'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/favicon.svg')).toContain('max-age=86400')
    expect(cacheControlForPath('/marketing/filing-cabinet.jpg')).toContain(
      'stale-while-revalidate',
    )
  })

  it('never caches API / share / embed endpoints', async () => {
    process.env.NODE_ENV = 'production'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/api/health')).toBe('private, no-store')
    expect(cacheControlForPath('/s/abc')).toBe('private, no-store')
    expect(cacheControlForPath('/e/tok')).toBe('private, no-store')
    expect(cacheControlForPath('/_serverFn/createShareLink')).toBe(
      'private, no-store',
    )
  })

  it('keeps SSR documents short-lived', async () => {
    process.env.NODE_ENV = 'production'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/files')).toBe('private, no-cache')
    expect(cacheControlForPath('/')).toBe('private, no-cache')
    expect(cacheControlForPath('/activity')).toBe('private, no-cache')
  })

  it('long-caches og.svg like other public icons', async () => {
    process.env.NODE_ENV = 'production'
    const { cacheControlForPath } = await import('#/lib/http-cache')
    expect(cacheControlForPath('/og.svg')).toContain('max-age=86400')
  })
})
