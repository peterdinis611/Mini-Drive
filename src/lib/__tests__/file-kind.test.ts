import { describe, expect, it } from 'vitest'

import {
  canInlinePreview,
  codeLanguageFromName,
  type FileKind,
  fileKindIcon,
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

  it('detects spreadsheet, office and archive', () => {
    expect(getFileKind('text/csv', 'report.csv')).toBe('spreadsheet')
    expect(getFileKind('', 'sheet.xlsx')).toBe('office')
    expect(getFileKind('', 'brief.docx')).toBe('office')
    expect(getFileKind('application/zip', 'pack.zip')).toBe('archive')
  })

  it('detects video and audio from mime and extension', () => {
    expect(getFileKind('video/mp4', 'clip.mp4')).toBe('video')
    expect(getFileKind('', 'movie.webm')).toBe('video')
    expect(getFileKind('audio/mpeg', 'song.mp3')).toBe('audio')
    expect(getFileKind('', 'track.wav')).toBe('audio')
  })

  it('falls back to file', () => {
    expect(getFileKind('application/octet-stream', 'bin')).toBe('file')
  })
})

describe('fileKindLabel + fileKindIcon', () => {
  const kinds: FileKind[] = [
    'image',
    'video',
    'audio',
    'pdf',
    'text',
    'code',
    'spreadsheet',
    'archive',
    'file',
  ]

  it('labels every kind in Slovak', () => {
    expect(fileKindLabel('image')).toBe('Obrázok')
    expect(fileKindLabel('video')).toBe('Video')
    expect(fileKindLabel('audio')).toBe('Audio')
    expect(fileKindLabel('pdf')).toBe('PDF')
    expect(fileKindLabel('text')).toBe('Text')
    expect(fileKindLabel('code')).toBe('Kód')
    expect(fileKindLabel('spreadsheet')).toBe('Tabuľka')
    expect(fileKindLabel('office')).toBe('Office')
    expect(fileKindLabel('archive')).toBe('Archív')
    expect(fileKindLabel('file')).toBe('Súbor')
  })

  it('returns a lucide icon component for every kind', () => {
    for (const kind of [...kinds, 'office' as FileKind]) {
      expect(typeof fileKindIcon(kind)).toBe('object')
    }
  })
})

describe('canInlinePreview', () => {
  it('allows rich previews but not archives/generic files', () => {
    expect(canInlinePreview('image')).toBe(true)
    expect(canInlinePreview('code')).toBe(true)
    expect(canInlinePreview('spreadsheet')).toBe(true)
    expect(canInlinePreview('office')).toBe(true)
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
