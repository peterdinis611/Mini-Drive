import { describe, expect, it } from 'vitest'

import { APP_NAME } from '#/lib/constants'
import { buildSeoHead, privateAppHead } from '#/lib/seo'

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
      content: 'index, follow, max-image-preview:large',
    })
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
})
