import { createIsomorphicFn } from '@tanstack/react-start'

import { APP_NAME } from '#/lib/constants'

/** Public site origin — never put secrets here. */
export const getSiteUrl = createIsomorphicFn()
  .server(() => {
    const raw =
      process.env.APP_URL ??
      process.env.BETTER_AUTH_URL ??
      'http://localhost:3000'
    return raw.replace(/\/$/, '')
  })
  .client(() => window.location.origin)

export const SITE = {
  name: APP_NAME,
  tagline: 'Osobné úložisko súborov so safe-url zdieľaním',
  description:
    'Mini Drive — súkromné cloud úložisko súborov. Nahrávaj, organizuj priečinky a zdieľaj cez dočasné safe-url odkazy.',
  locale: 'sk_SK',
} as const

export const PUBLIC_PATHS = ['/login', '/register'] as const

export const DISALLOW_PATHS = [
  '/files',
  '/files/',
  '/recent',
  '/shares',
  '/settings',
  '/onboarding',
  '/api/',
  '/s/',
] as const
