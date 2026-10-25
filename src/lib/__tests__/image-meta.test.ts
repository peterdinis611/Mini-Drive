import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadImageMeta, saveImageMeta } from '#/lib/image-meta'

describe('image-meta localStorage', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
    })
  })

  it('returns fallback when missing', () => {
    expect(loadImageMeta('id-1', 'photo.png')).toEqual({
      caption: '',
      altText: 'photo.png',
    })
  })

  it('round-trips caption and alt', () => {
    saveImageMeta('id-1', { caption: 'Hello', altText: 'Alt' })
    expect(loadImageMeta('id-1', 'fallback.png')).toEqual({
      caption: 'Hello',
      altText: 'Alt',
    })
  })

  it('no-ops without fileId', () => {
    saveImageMeta(undefined, { caption: 'x', altText: 'y' })
    expect(loadImageMeta(undefined, 'z')).toEqual({
      caption: '',
      altText: 'z',
    })
  })
})
