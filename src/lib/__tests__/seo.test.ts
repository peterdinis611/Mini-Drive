import { describe, expect, it } from 'vitest'

import { APP_NAME } from '#/lib/constants'
import {
  appJsonLd,
  authPageHead,
  buildSeoHead,
  landingPageJsonLd,
  privateAppHead,
} from '#/lib/seo'
import { SITE } from '#/lib/site'

describe('buildSeoHead', () => {
  it('adds brand suffix, robots, canonical and hreflang', () => {
    const head = buildSeoHead({
      title: 'Prihlásenie',
      path: '/login',
    })

    expect(head.meta).toContainEqual({
      title: `Prihlásenie · ${APP_NAME}`,
    })
    expect(head.meta).toContainEqual({
      name: 'robots',
      content:
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    })
    expect(head.meta.some((m) => 'name' in m && m.name === 'keywords')).toBe(
      true,
    )
    expect(head.links.some((l) => l.rel === 'canonical')).toBe(true)
    expect(
      head.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'sk'),
    ).toBe(true)
    expect(head.links[0]?.href).toMatch(/\/login$/)
  })

  it('marks private pages as noindex', () => {
    const head = privateAppHead('Súbory', '/files')
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow, noarchive',
    })
  })

  it('builds auth heads for login and register', () => {
    expect(authPageHead('login').links[0]?.href).toMatch(/\/sign-in$/)
    expect(authPageHead('register').links[0]?.href).toMatch(/\/sign-up$/)
  })

  it('attaches optional page JSON-LD scripts', () => {
    const head = buildSeoHead({
      title: 'Home',
      path: '/',
      brandSuffix: false,
      jsonLd: [landingPageJsonLd()],
    })
    expect(head.scripts?.length).toBe(1)
    expect(head.scripts?.[0]?.type).toBe('application/ld+json')
    expect(head.scripts?.[0]?.children).toContain('WebPage')
  })
})

describe('appJsonLd', () => {
  it('emits Organization + WebSite + WebApplication graph', () => {
    const script = appJsonLd()
    const parsed = JSON.parse(script.children) as {
      '@graph': Array<{
        '@type': string
        name?: string
        featureList?: string[]
      }>
    }
    const types = parsed['@graph'].map((node) => node['@type'])
    expect(types).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'WebApplication']),
    )
    expect(parsed['@graph'].some((n) => n.name === APP_NAME)).toBe(true)
    expect(SITE.description.length).toBeGreaterThan(40)
    expect(SITE.features.length).toBeGreaterThan(3)
  })
})

describe('landingPageJsonLd', () => {
  it('describes the homepage WebPage', () => {
    const node = landingPageJsonLd()
    expect(node['@type']).toBe('WebPage')
    expect(node.inLanguage).toBe('sk')
  })
})
