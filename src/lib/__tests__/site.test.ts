import { describe, expect, it } from 'vitest'

import { APP_NAME } from '#/lib/constants'
import { DISALLOW_PATHS, PUBLIC_PATHS, SITE } from '#/lib/site'

describe('SITE metadata', () => {
  it('brands Mini Drive in Slovak', () => {
    expect(SITE.name).toBe(APP_NAME)
    expect(SITE.language).toBe('sk')
    expect(SITE.locale).toBe('sk_SK')
    expect(SITE.tagline.length).toBeGreaterThan(0)
    expect(SITE.features.length).toBeGreaterThan(3)
  })

  it('separates public and private robots paths', () => {
    expect(PUBLIC_PATHS).toContain('/')
    expect(PUBLIC_PATHS).toContain('/sign-in')
    expect(DISALLOW_PATHS).toContain('/files')
    expect(DISALLOW_PATHS).toContain('/api/')
    expect(DISALLOW_PATHS).toContain('/s/')
    for (const path of PUBLIC_PATHS) {
      expect(DISALLOW_PATHS).not.toContain(path)
    }
  })
})
