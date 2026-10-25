import { APP_NAME } from '#/lib/constants'
import { SITE, getSiteUrl } from '#/lib/site'

type SeoInput = {
  title: string
  description?: string
  path?: string
  /** When true, search engines should not index the page. */
  noIndex?: boolean
  ogType?: 'website' | 'article' | 'profile'
  image?: string
  /** Append " · Mini Drive" unless title already contains the brand. */
  brandSuffix?: boolean
  keywords?: readonly string[]
}

type HeadResult = {
  meta: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
  >
  links: Array<{ rel: string; href: string }>
  scripts?: Array<{ type: string; children: string }>
}

export function buildSeoHead({
  title,
  description = SITE.description,
  path = '/',
  noIndex = false,
  ogType = 'website',
  image,
  brandSuffix = true,
  keywords = SITE.keywords,
}: SeoInput): HeadResult {
  const siteUrl = getSiteUrl()
  const canonical = `${siteUrl}${path === '/' ? '' : path}`
  const ogImage = image ?? `${siteUrl}/og.svg`
  const fullTitle =
    brandSuffix && !title.includes(APP_NAME)
      ? `${title} · ${APP_NAME}`
      : title

  const meta: HeadResult['meta'] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'author', content: SITE.author },
    { name: 'application-name', content: APP_NAME },
    { name: 'apple-mobile-web-app-title', content: APP_NAME },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'keywords', content: [...keywords].join(', ') },
    {
      name: 'robots',
      content: noIndex
        ? 'noindex, nofollow, noarchive'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    },
    { name: 'googlebot', content: noIndex ? 'noindex, nofollow' : 'index, follow' },
    { property: 'og:site_name', content: APP_NAME },
    { property: 'og:type', content: ogType },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: `${APP_NAME} — ${SITE.tagline}` },
    { property: 'og:image:type', content: 'image/svg+xml' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: `${APP_NAME} — ${SITE.tagline}` },
  ]

  return {
    meta,
    links: [{ rel: 'canonical', href: canonical }],
  }
}

export function appJsonLd() {
  const siteUrl = getSiteUrl()
  return {
    type: 'application/ld+json' as const,
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: APP_NAME,
          url: siteUrl,
          logo: `${siteUrl}/favicon.svg`,
          description: SITE.shortDescription,
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: siteUrl,
          name: APP_NAME,
          description: SITE.description,
          inLanguage: SITE.language,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'WebApplication',
          '@id': `${siteUrl}/#app`,
          name: APP_NAME,
          description: SITE.description,
          url: siteUrl,
          applicationCategory: SITE.category,
          operatingSystem: 'Web',
          browserRequirements: 'Requires JavaScript',
          inLanguage: SITE.language,
          isAccessibleForFree: true,
          image: `${siteUrl}/og.svg`,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
          },
          featureList: [
            'Private file storage',
            'Safe-url sharing',
            'Folder organization',
            'Image crop and versions',
            'Trash with retention',
          ],
          publisher: { '@id': `${siteUrl}/#organization` },
        },
      ],
    }),
  }
}

export function privateAppHead(title: string, path = '/files') {
  return buildSeoHead({
    title,
    description: `${title} v ${APP_NAME}. Súkromná stránka — vyžaduje prihlásenie.`,
    path,
    noIndex: true,
    brandSuffix: true,
  })
}

export function authPageHead(
  mode: 'login' | 'register',
): ReturnType<typeof buildSeoHead> {
  if (mode === 'login') {
    return buildSeoHead({
      title: 'Prihlásenie',
      description:
        'Prihlás sa do Mini Drive a spravuj súbory, priečinky, kôš a safe-url zdieľania v súkromnom archíve.',
      path: '/login',
    })
  }
  return buildSeoHead({
    title: 'Registrácia',
    description:
      'Vytvor si účet v Mini Drive — súkromné cloud úložisko so safe-url zdieľaním, košom a verziami súborov.',
    path: '/register',
  })
}
