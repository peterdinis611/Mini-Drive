import { describe, expect, it, vi } from 'vitest'

import {
  buildCssFilter,
  clampViewZoom,
  downloadBlob,
  filtersAreDefault,
  rotateSize,
  withCroppedName,
  withEditedName,
} from '#/lib/crop-image'

describe('withCroppedName', () => {
  it('inserts -cropped before extension', () => {
    expect(withCroppedName('photo.png')).toBe('photo-cropped.png')
    expect(withCroppedName('archive.tar.gz')).toBe('archive.tar-cropped.gz')
  })

  it('appends -cropped.jpg when no extension', () => {
    expect(withCroppedName('screenshot')).toBe('screenshot-cropped.jpg')
  })

  it('handles leading-dot names as no extension', () => {
    expect(withCroppedName('.env')).toBe('.env-cropped.jpg')
  })
})

describe('rotateSize', () => {
  it('keeps size at 0°', () => {
    expect(rotateSize(100, 50, 0)).toEqual({ width: 100, height: 50 })
  })

  it('swaps axes at 90°', () => {
    const size = rotateSize(100, 50, 90)
    expect(size.width).toBeCloseTo(50)
    expect(size.height).toBeCloseTo(100)
  })

  it('grows bounding box at 45°', () => {
    const size = rotateSize(100, 100, 45)
    expect(size.width).toBeGreaterThan(100)
    expect(size.height).toBeGreaterThan(100)
  })
})

describe('withEditedName', () => {
  it('inserts suffix before extension', () => {
    expect(withEditedName('photo.png')).toBe('photo-edited.png')
    expect(withEditedName('photo.png', 'annotated')).toBe(
      'photo-annotated.png',
    )
  })
})

describe('clampViewZoom', () => {
  it('clamps to range', () => {
    expect(clampViewZoom(0.01)).toBe(0.25)
    expect(clampViewZoom(99)).toBe(5)
    expect(clampViewZoom(1.26)).toBe(1.26)
  })
})

describe('buildCssFilter', () => {
  it('returns none for defaults', () => {
    expect(buildCssFilter()).toBe('none')
    expect(buildCssFilter({ brightness: 1, contrast: 1 })).toBe('none')
  })

  it('composes brightness, contrast, saturate, grayscale, sepia', () => {
    expect(
      buildCssFilter({
        brightness: 1.2,
        contrast: 0.8,
        saturation: 1.5,
        grayscale: 0.5,
        sepia: 0.25,
      }),
    ).toBe(
      'brightness(1.2) contrast(0.8) saturate(1.5) grayscale(0.5) sepia(0.25)',
    )
  })
})

describe('filtersAreDefault', () => {
  it('detects custom filters', () => {
    expect(filtersAreDefault({})).toBe(true)
    expect(filtersAreDefault({ saturation: 1.2 })).toBe(false)
    expect(filtersAreDefault({ grayscale: 1 })).toBe(false)
  })
})

describe('downloadBlob', () => {
  it('creates temporary object URL and clicks an anchor', () => {
    const click = vi.fn()
    const revoke = vi.fn()
    const create = vi.fn(() => 'blob:mock')

    vi.stubGlobal('URL', {
      createObjectURL: create,
      revokeObjectURL: revoke,
    })

    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        el.click = click
      }
      return el
    })

    downloadBlob(new Blob(['x']), 'out.png')

    expect(create).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:mock')

    vi.restoreAllMocks()
  })
})
