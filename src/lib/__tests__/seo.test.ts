import { describe, expect, it } from 'vitest'

import { APP_NAME } from '#/lib/constants'
import { SITE } from '#/lib/site'
import {
  appJsonLd,
  authPageHead,
  buildSeoHead,
  privateAppHead,
} from '#/lib/seo'

describe('buildSeoHead', () => {
  it('adds brand suffix and index robots by default', () => {
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
    expect(head.links[0]?.rel).toBe('canonical')
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
    expect(authPageHead('login').links[0]?.href).toMatch(/\/login$/)
    expect(authPageHead('register').links[0]?.href).toMatch(/\/register$/)
  })
})

describe('appJsonLd', () => {
  it('emits Organization + WebSite + WebApplication graph', () => {
    const script = appJsonLd()
    const parsed = JSON.parse(script.children) as {
      '@graph': Array<{ '@type': string; name?: string }>
    }
    const types = parsed['@graph'].map((node) => node['@type'])
    expect(types).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'WebApplication']),
    )
    expect(parsed['@graph'].some((n) => n.name === APP_NAME)).toBe(true)
    expect(SITE.description.length).toBeGreaterThan(40)
  })
})
