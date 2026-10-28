import { createIsomorphicFn } from '@tanstack/react-start'

import { APP_NAME } from '#/lib/constants'

/** Public site origin — never put secrets here. */
export const getSiteUrl = createIsomorphicFn()
  .server(() => {
    const raw = process.env.APP_URL ?? 'http://localhost:3000'
    return raw.replace(/\/$/, '')
  })
  .client(() => window.location.origin)

export const SITE = {
  name: APP_NAME,
  tagline: 'Súkromný archív so safe-url',
  description:
    'Mini Drive je súkromný archív súborov: nahrávaj, organizuj priečinky a zdieľaj cez dočasné safe-url odkazy bez odhalenia interných kľúčov.',
  shortDescription: 'Súkromný archív so safe-url, košom a kvótou.',
  locale: 'sk_SK',
  language: 'sk',
  keywords: [
    'Mini Drive',
    'súkromný archív',
    'cloud úložisko',
    'zdieľanie súborov',
    'safe url',
    'dočasný odkaz',
    'priečinky',
    'kôš súborov',
  ] as const,
  themeColorLight: '#f6faf7',
  themeColorDark: '#12161f',
  author: APP_NAME,
  category: 'BusinessApplication',
  features: [
    'Súkromné úložisko súborov',
    'Safe-url zdieľanie s expiráciou',
    'Priečinky a organizácia',
    'Verzie a úpravy obrázkov',
    'Kôš s retenčnou politikou',
    'Tvrdá kvóta úložiska',
  ] as const,
} as const

/** Indexable marketing / auth surfaces. */
export const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up'] as const

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
