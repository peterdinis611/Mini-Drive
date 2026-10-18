import { describe, expect, it } from 'vitest'

import {
  canInlinePreview,
  codeLanguageFromName,
  fileKindLabel,
  getFileKind,
} from '#/lib/file-kind'

describe('getFileKind', () => {
  it('detects images from mime and extension', () => {
    expect(getFileKind('image/png', 'a.png')).toBe('image')
    expect(getFileKind('', 'photo.JPEG')).toBe('image')
  })

  it('detects pdf, text and code', () => {
    expect(getFileKind('application/pdf', 'x.pdf')).toBe('pdf')
    expect(getFileKind('text/plain', 'notes.txt')).toBe('text')
    expect(getFileKind('text/plain', 'app.ts')).toBe('code')
    expect(getFileKind('application/json', 'data.json')).toBe('code')
  })

  it('detects spreadsheet and archive', () => {
    expect(getFileKind('text/csv', 'report.csv')).toBe('spreadsheet')
    expect(getFileKind('', 'sheet.xlsx')).toBe('spreadsheet')
    expect(getFileKind('application/zip', 'pack.zip')).toBe('archive')
  })

  it('falls back to file', () => {
    expect(getFileKind('application/octet-stream', 'bin')).toBe('file')
    expect(fileKindLabel('file')).toBe('Súbor')
  })
})

describe('canInlinePreview', () => {
  it('allows rich previews but not archives/generic files', () => {
    expect(canInlinePreview('image')).toBe(true)
    expect(canInlinePreview('code')).toBe(true)
    expect(canInlinePreview('spreadsheet')).toBe(true)
    expect(canInlinePreview('archive')).toBe(false)
    expect(canInlinePreview('file')).toBe(false)
  })
})

describe('codeLanguageFromName', () => {
  it('maps common extensions', () => {
    expect(codeLanguageFromName('main.ts')).toBe('TypeScript')
    expect(codeLanguageFromName('App.tsx')).toBe('TSX')
    expect(codeLanguageFromName('unknown.xyz')).toBe('XYZ')
  })
})
