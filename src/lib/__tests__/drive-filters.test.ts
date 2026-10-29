import { describe, expect, it } from 'vitest'

import { filterDriveFiles, filterDriveFolders } from '#/lib/drive-filters'

const folders = [
  { id: 'f1', name: 'DEMO' },
  { id: 'f2', name: 'Archív' },
]

const files = [
  { id: '1', name: 'photo.png', mimeType: 'image/png' },
  { id: '2', name: 'doc.pdf', mimeType: 'application/pdf' },
  { id: '3', name: 'clip.mp4', mimeType: 'video/mp4' },
  { id: '4', name: 'song.mp3', mimeType: 'audio/mpeg' },
  { id: '5', name: 'notes.txt', mimeType: 'text/plain' },
  { id: '6', name: 'app.ts', mimeType: 'text/plain' },
]

describe('filterDriveFolders', () => {
  it('returns all when kind=all and no query', () => {
    expect(filterDriveFolders(folders, 'all', '')).toHaveLength(2)
  })

  it('hides folders when kind filter is active', () => {
    expect(filterDriveFolders(folders, 'image', '')).toEqual([])
  })

  it('filters by name query case-insensitively', () => {
    expect(filterDriveFolders(folders, 'all', 'demo')).toEqual([folders[0]])
  })

  it('fuzzy-matches folder names via Fuse.js', () => {
    expect(
      filterDriveFolders(folders, 'all', 'archiv').map((f) => f.id),
    ).toEqual(['f2'])
  })
})

describe('filterDriveFiles', () => {
  it('returns everything for kind=all', () => {
    expect(filterDriveFiles(files, 'all', '')).toHaveLength(6)
  })

  it('filters by kind', () => {
    expect(filterDriveFiles(files, 'image', '').map((f) => f.id)).toEqual(['1'])
    expect(filterDriveFiles(files, 'pdf', '').map((f) => f.id)).toEqual(['2'])
    expect(filterDriveFiles(files, 'video', '').map((f) => f.id)).toEqual(['3'])
    expect(filterDriveFiles(files, 'audio', '').map((f) => f.id)).toEqual(['4'])
  })

  it('text chip includes plain text and code', () => {
    expect(filterDriveFiles(files, 'text', '').map((f) => f.id)).toEqual([
      '5',
      '6',
    ])
  })

  it('combines kind + query', () => {
    expect(filterDriveFiles(files, 'image', 'photo').map((f) => f.id)).toEqual([
      '1',
    ])
    expect(filterDriveFiles(files, 'image', 'doc')).toEqual([])
  })

  it('fuzzy-matches file names via Fuse.js', () => {
    expect(filterDriveFiles(files, 'all', 'phote').map((f) => f.id)).toEqual([
      '1',
    ])
  })
})
