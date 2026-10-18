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
    { name: 'application-name', content: APP_NAME },
    { name: 'apple-mobile-web-app-title', content: APP_NAME },
    {
      name: 'robots',
      content: noIndex
        ? 'noindex, nofollow, noarchive'
        : 'index, follow, max-image-preview:large',
    },
    { property: 'og:site_name', content: APP_NAME },
    { property: 'og:type', content: ogType },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
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
      '@type': 'WebApplication',
      name: APP_NAME,
      description: SITE.description,
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'sk',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    }),
  }
}

export function privateAppHead(title: string, path = '/files') {
  return buildSeoHead({
    title,
    description: `${title} v ${APP_NAME}. Táto stránka je súkromná.`,
    path,
    noIndex: true,
    brandSuffix: true,
  })
}
