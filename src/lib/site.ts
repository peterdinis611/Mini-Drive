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
  tagline: 'Súkromný archív súborov so safe-url zdieľaním',
  description:
    'Mini Drive je súkromné cloud úložisko: nahrávaj súbory, organizuj priečinky, orež obrázky a zdieľaj cez dočasné safe-url odkazy bez odhalenia interných kľúčov.',
  shortDescription:
    'Súkromné úložisko súborov so safe-url zdieľaním, košom a verziami.',
  locale: 'sk_SK',
  language: 'sk',
  keywords: [
    'Mini Drive',
    'cloud úložisko',
    'súkromné súbory',
    'safe url',
    'zdieľanie súborov',
    'UploadThing',
    'TanStack Start',
  ] as const,
  themeColorLight: '#008ea8',
  themeColorDark: '#0e1014',
  author: APP_NAME,
  category: 'BusinessApplication',
} as const

/** Indexable marketing / auth surfaces. */
export const PUBLIC_PATHS = ['/', '/login', '/register'] as const

/** Private app + APIs — blocked in robots.txt. */
export const DISALLOW_PATHS = [
  '/files',
  '/files/',
  '/recent',
  '/shares',
  '/settings',
  '/trash',
  '/onboarding',
  '/api/',
  '/s/',
] as const
