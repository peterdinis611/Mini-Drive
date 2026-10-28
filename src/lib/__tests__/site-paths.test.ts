import { describe, expect, it } from 'vitest'

import { DISALLOW_PATHS, PUBLIC_PATHS } from '#/lib/site'

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
        '/settings',
        '/onboarding',
        '/api/',
        '/s/',
      ]),
    )
  })
})
