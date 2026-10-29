import Fuse from 'fuse.js'
import { describe, expect, it } from 'vitest'

import { DRIVE_FUSE_OPTIONS } from '#/lib/fuse-options'

describe('DRIVE_FUSE_OPTIONS', () => {
  it('exposes sensible defaults for drive search', () => {
    expect(DRIVE_FUSE_OPTIONS.threshold).toBe(0.38)
    expect(DRIVE_FUSE_OPTIONS.ignoreLocation).toBe(true)
    expect(DRIVE_FUSE_OPTIONS.ignoreDiacritics).toBe(true)
    expect(DRIVE_FUSE_OPTIONS.includeScore).toBe(true)
    expect(DRIVE_FUSE_OPTIONS.minMatchCharLength).toBe(1)
  })

  it('matches Slovak diacritics-insensitive queries', () => {
    const fuse = new Fuse(
      [{ name: 'Prázdniny' }, { name: 'Pracovné' }, { name: 'Fotky' }],
      { ...DRIVE_FUSE_OPTIONS, keys: ['name'] },
    )
    const hits = fuse.search('prazdniny').map((hit) => hit.item.name)
    expect(hits).toContain('Prázdniny')
  })
})
