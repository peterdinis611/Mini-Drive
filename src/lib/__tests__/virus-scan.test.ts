import { describe, expect, it } from 'vitest'

import { EICAR_SIGNATURE, scanBufferHeuristics } from '#/lib/virus-scan'

describe('scanBufferHeuristics', () => {
  it('passes clean png-like bytes', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
    const result = scanBufferHeuristics(bytes, {
      fileName: 'photo.png',
      mimeType: 'image/png',
    })
    expect(result.verdict).toBe('clean')
    expect(result.findings).toHaveLength(0)
  })

  it('flags EICAR', () => {
    const bytes = new TextEncoder().encode(EICAR_SIGNATURE)
    const result = scanBufferHeuristics(bytes, {
      fileName: 'eicar.com',
      mimeType: 'application/octet-stream',
    })
    expect(result.verdict).toBe('infected')
    expect(result.findings.some((f) => f.code === 'EICAR')).toBe(true)
  })

  it('flags double extension', () => {
    const result = scanBufferHeuristics(new Uint8Array([1, 2, 3]), {
      fileName: 'invoice.pdf.exe',
      mimeType: 'application/octet-stream',
    })
    expect(result.verdict).toBe('infected')
    expect(result.findings.some((f) => f.code === 'DOUBLE_EXT')).toBe(true)
  })

  it('flags PE polyglot in image mime', () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00])
    const result = scanBufferHeuristics(bytes, {
      fileName: 'cat.jpg',
      mimeType: 'image/jpeg',
    })
    expect(result.verdict).toBe('infected')
    expect(result.findings.some((f) => f.code === 'PE_POLYGLOT')).toBe(true)
  })
})
