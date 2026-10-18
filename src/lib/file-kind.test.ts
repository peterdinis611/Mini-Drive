import { describe, expect, it } from 'vitest'

import { fileKindLabel, getFileKind } from '#/lib/file-kind'

describe('getFileKind', () => {
  it('detects images from mime and extension', () => {
    expect(getFileKind('image/png', 'a.png')).toBe('image')
    expect(getFileKind('', 'photo.JPEG')).toBe('image')
  })

  it('detects pdf and text', () => {
    expect(getFileKind('application/pdf', 'x.pdf')).toBe('pdf')
    expect(getFileKind('text/plain', 'notes.txt')).toBe('text')
  })

  it('falls back to file', () => {
    expect(getFileKind('application/octet-stream', 'bin')).toBe('file')
    expect(fileKindLabel('file')).toBe('Súbor')
  })
})
