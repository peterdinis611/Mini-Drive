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
  /** Extra JSON-LD scripts for this page. */
  jsonLd?: Array<Record<string, unknown>>
}

type HeadResult = {
  meta: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
  >
  links: Array<{
    rel: string
    href: string
    hrefLang?: string
    type?: string
  }>
  scripts?: Array<{ type: string; children: string }>
}

function absoluteUrl(path: string): string {
  const siteUrl = getSiteUrl()
  if (!path || path === '/') return siteUrl
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
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
  jsonLd = [],
}: SeoInput): HeadResult {
  const siteUrl = getSiteUrl()
  const canonical = absoluteUrl(path)
  const ogImage = image ?? `${siteUrl}/og.svg`
  const fullTitle =
    brandSuffix && !title.includes(APP_NAME)
      ? `${title} · ${APP_NAME}`
      : title

  const robots = noIndex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

  const meta: HeadResult['meta'] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'author', content: SITE.author },
    { name: 'creator', content: SITE.author },
    { name: 'application-name', content: APP_NAME },
    { name: 'apple-mobile-web-app-title', content: APP_NAME },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'keywords', content: [...keywords].join(', ') },
    { name: 'robots', content: robots },
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

  if (canonical.startsWith('https://')) {
    meta.push({ property: 'og:image:secure_url', content: ogImage })
  }

  const scripts =
    jsonLd.length > 0
      ? jsonLd.map((node) => ({
          type: 'application/ld+json' as const,
          children: JSON.stringify(node),
        }))
      : undefined

  return {
    meta,
    links: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hrefLang: SITE.language, href: canonical },
      { rel: 'alternate', hrefLang: 'x-default', href: canonical },
    ],
    scripts,
  }
}

/** Sitewide graph — Organization, WebSite, WebApplication. */
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
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/favicon.svg`,
          },
          description: SITE.shortDescription,
          inLanguage: SITE.language,
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
          alternateName: SITE.tagline,
          description: SITE.description,
          url: siteUrl,
          applicationCategory: SITE.category,
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript. Requires HTML5.',
          inLanguage: SITE.language,
          isAccessibleForFree: true,
          image: `${siteUrl}/og.svg`,
          screenshot: `${siteUrl}/og.svg`,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
          featureList: [...SITE.features],
          publisher: { '@id': `${siteUrl}/#organization` },
        },
      ],
    }),
  }
}

/** Homepage WebPage node — attach via route `head`. */
export function landingPageJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/#webpage`,
    url: siteUrl,
    name: `${APP_NAME} — ${SITE.tagline}`,
    description: SITE.description,
    inLanguage: SITE.language,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#app` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${siteUrl}/og.svg`,
      width: 1200,
      height: 630,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.landing-center h1', '.landing-center p'],
    },
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
      path: '/sign-in',
    })
  }
  return buildSeoHead({
    title: 'Registrácia',
    description:
      'Vytvor si účet v Mini Drive — súkromné cloud úložisko so safe-url zdieľaním, košom a verziami súborov.',
    path: '/sign-up',
  })
}
