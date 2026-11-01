import { describe, expect, it } from 'vitest'

import { compileDriveRegex, fieldsMatchRegex } from '#/lib/drive-search-mode'

describe('compileDriveRegex', () => {
  it('compiles raw patterns with default iu flags', () => {
    const re = compileDriveRegex('zmluva')
    expect(re?.flags).toContain('i')
    expect(re?.test('Zmluva.pdf')).toBe(true)
  })

  it('parses /pattern/flags form', () => {
    const re = compileDriveRegex('/\\.pdf$/')
    expect(re?.test('doc.pdf')).toBe(true)
    expect(re?.test('doc.PDF')).toBe(false)
  })

  it('returns null for empty or invalid patterns', () => {
    expect(compileDriveRegex('')).toBeNull()
    expect(compileDriveRegex('   ')).toBeNull()
    expect(compileDriveRegex('(')).toBeNull()
    expect(compileDriveRegex('//')).toBeNull()
  })
})

describe('fieldsMatchRegex', () => {
  it('matches any provided field', () => {
    const re = compileDriveRegex('/png/i')!
    expect(fieldsMatchRegex(['doc.pdf', 'image/png'], re)).toBe(true)
    expect(fieldsMatchRegex(['doc.pdf', null], re)).toBe(false)
  })
})
