import { describe, expect, it, vi } from 'vitest'

import { isImageMimeType, preloadImages } from '#/lib/preload'

describe('isImageMimeType', () => {
  it('delegates to mime helper', () => {
    expect(isImageMimeType('image/png', 'a.png')).toBe(true)
    expect(isImageMimeType('text/plain', 'a.txt')).toBe(false)
  })
})

describe('preloadImages', () => {
  it('creates Image for new urls and skips duplicates / empties', () => {
    const srcs: string[] = []
    class MockImage {
      decoding = ''
      set src(value: string) {
        srcs.push(value)
      }
    }
    vi.stubGlobal('Image', MockImage)

    preloadImages([null, undefined, 'https://cdn/a.png', 'https://cdn/a.png'])
    preloadImages(['https://cdn/a.png', 'https://cdn/b.png'])

    expect(srcs).toEqual(['https://cdn/a.png', 'https://cdn/b.png'])
    vi.unstubAllGlobals()
  })
})
