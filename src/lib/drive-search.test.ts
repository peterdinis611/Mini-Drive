import { describe, expect, it } from 'vitest'

import {
  buildDriveSearchItems,
  createDriveFuse,
  searchDriveItems,
} from '#/lib/drive-search'

const folders = [
  { id: 'f1', parentId: null, name: 'Fotky' },
  { id: 'f2', parentId: 'f1', name: 'Dovolenka' },
]

const files = [
  {
    id: 'a',
    name: 'more.png',
    size: 1200,
    mimeType: 'image/png',
    folderId: 'f2',
  },
  {
    id: 'b',
    name: 'zmluva.pdf',
    size: 8000,
    mimeType: 'application/pdf',
    folderId: null,
  },
]

describe('drive-search', () => {
  it('builds path labels for nested folders and files', () => {
    const items = buildDriveSearchItems(folders, files)
    const nested = items.find(
      (item) => item.kind === 'file' && item.id === 'a',
    )
    expect(nested?.pathLabel).toBe('Súbory / Fotky / Dovolenka')
  })

  it('fuzzy-matches typos via Fuse.js', () => {
    const items = buildDriveSearchItems(folders, files)
    const fuse = createDriveFuse(items)
    const results = searchDriveItems(fuse, items, 'zmluv')
    expect(results.some((item) => item.name === 'zmluva.pdf')).toBe(true)
  })

  it('returns recent items when query is empty', () => {
    const items = buildDriveSearchItems(folders, files)
    const fuse = createDriveFuse(items)
    const results = searchDriveItems(fuse, items, '', 2)
    expect(results).toHaveLength(2)
  })
})
