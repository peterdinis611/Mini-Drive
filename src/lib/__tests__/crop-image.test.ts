import { describe, expect, it, vi } from 'vitest'

import { downloadBlob, rotateSize, withCroppedName } from '#/lib/crop-image'

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
