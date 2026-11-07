/**
 * Public / guest-safe GET surfaces for load mix.
 * Authenticated APIs and UploadThing are intentionally omitted.
 */

export type Probe = {
  path: string
  /** k6 metric tag `name` */
  name: string
  /** Allowed HTTP statuses (after following redirects unless noted). */
  allowed: number[]
  /** When set, k6 will not follow redirects (observe 3xx). */
  redirects?: number
}

/** Marketing + SEO + health. */
export const PUBLIC_PROBES: Probe[] = [
  { path: '/api/health', name: 'health', allowed: [200] },
  { path: '/', name: 'landing', allowed: [200] },
  { path: '/robots.txt', name: 'robots', allowed: [200] },
  { path: '/sitemap.xml', name: 'sitemap', allowed: [200] },
  { path: '/sign-in', name: 'sign_in', allowed: [200] },
  { path: '/sign-up', name: 'sign_up', allowed: [200] },
  { path: '/og.svg', name: 'og_svg', allowed: [200] },
  { path: '/favicon.svg', name: 'favicon', allowed: [200] },
  { path: '/site.webmanifest', name: 'webmanifest', allowed: [200] },
  {
    path: '/marketing/filing-cabinet.jpg',
    name: 'marketing_hero',
    allowed: [200],
  },
]

/** Static / cacheable assets only. */
export const STATIC_PROBES: Probe[] = PUBLIC_PROBES.filter((p) =>
  [
    'og_svg',
    'favicon',
    'webmanifest',
    'marketing_hero',
    'robots',
    'sitemap',
  ].includes(p.name),
)

/**
 * Private app routes as guest — expect HTTP redirect to auth, or a soft
 * 200 after framework handling. Never 5xx.
 */
export const GUEST_GUARD_PROBES: Probe[] = [
  {
    path: '/files',
    name: 'guard_files',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
  {
    path: '/recent',
    name: 'guard_recent',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
  {
    path: '/shares',
    name: 'guard_shares',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
  {
    path: '/settings',
    name: 'guard_settings',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
  {
    path: '/trash',
    name: 'guard_trash',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
  {
    path: '/onboarding',
    name: 'guard_onboarding',
    allowed: [200, 302, 303, 307, 308],
    redirects: 0,
  },
]

export function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i]!
    if (roll <= 0) return items[i]!
  }
  return items[items.length - 1]!
}
