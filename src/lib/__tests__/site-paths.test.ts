import { describe, expect, it } from 'vitest'

import { APP_NAME } from '#/lib/constants'
import { DISALLOW_PATHS, PUBLIC_PATHS, SITE } from '#/lib/site'

describe('site paths after Clerk migration', () => {
  it('indexes Clerk auth routes instead of legacy login/register', () => {
    expect(PUBLIC_PATHS).toEqual(['/', '/sign-in', '/sign-up'])
    expect(PUBLIC_PATHS).not.toContain('/login')
    expect(PUBLIC_PATHS).not.toContain('/register')
  })

  it('keeps private app surfaces out of robots', () => {
    expect(DISALLOW_PATHS).toEqual(
      expect.arrayContaining([
        '/files',
        '/files/',
        '/recent',
        '/shares',
        '/settings',
        '/trash',
        '/onboarding',
        '/api/',
        '/s/',
      ]),
    )
  })
})

describe('SITE metadata', () => {
  it('carries Slovak branding and mint/navy theme tokens', () => {
    expect(SITE.name).toBe(APP_NAME)
    expect(SITE.language).toBe('sk')
    expect(SITE.locale).toBe('sk_SK')
    expect(SITE.themeColorLight).toBe('#f6faf7')
    expect(SITE.themeColorDark).toBe('#12161f')
    expect(SITE.description.length).toBeGreaterThan(40)
    expect(SITE.features.length).toBeGreaterThanOrEqual(4)
    expect(SITE.keywords).toEqual(
      expect.arrayContaining(['safe url', 'Mini Drive']),
    )
  })
})
