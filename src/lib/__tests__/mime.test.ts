import { describe, expect, it } from 'vitest'

import {
  canInlinePreview,
  isImageMimeType,
  isPdfMimeType,
  resolveStoredMimeType,
} from '#/lib/mime'

describe('resolveStoredMimeType', () => {
  it('passes through real mime types', () => {
    expect(resolveStoredMimeType('image/png', 'a.png')).toBe('image/png')
  })

  it('resolves images from extension when type is shorthand', () => {
    expect(resolveStoredMimeType('image', 'shot.webp')).toBe('image/webp')
    expect(resolveStoredMimeType('', 'photo.jpg')).toBe('image/jpeg')
    expect(resolveStoredMimeType('', 'pic.bmp')).toBe('image/bmp')
  })

  it('resolves pdf / video / audio', () => {
    expect(resolveStoredMimeType('', 'x.pdf')).toBe('application/pdf')
    expect(resolveStoredMimeType('', 'clip.mov')).toBe('video/quicktime')
    expect(resolveStoredMimeType('', 'track.flac')).toBe('audio/flac')
  })

  it('resolves spreadsheet / office / archive / code / text', () => {
    expect(resolveStoredMimeType('', 't.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(resolveStoredMimeType('', 'notes.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    expect(resolveStoredMimeType('', 'deck.pptx')).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    )
    expect(resolveStoredMimeType('', 'a.zip')).toBe('application/zip')
    expect(resolveStoredMimeType('', 'data.json')).toBe('application/json')
    expect(resolveStoredMimeType('', 'readme.md')).toBe('text/markdown')
  })

  it('canInlinePreview for office docs', () => {
    expect(
      canInlinePreview(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'notes.docx',
      ),
    ).toBe(true)
  })

  it('falls back to octet-stream for unknown blobs', () => {
    expect(resolveStoredMimeType('', 'bin')).toBe('application/octet-stream')
  })
})

describe('mime helpers', () => {
  it('detects image and pdf', () => {
    expect(isImageMimeType('image/png', 'a.png')).toBe(true)
    expect(isImageMimeType('application/pdf', 'a.pdf')).toBe(false)
    expect(isPdfMimeType('application/pdf', 'a.pdf')).toBe(true)
  })

  it('canInlinePreview mirrors file-kind rules', () => {
    expect(canInlinePreview('image/png', 'a.png')).toBe(true)
    expect(canInlinePreview('application/zip', 'a.zip')).toBe(false)
  })
})
