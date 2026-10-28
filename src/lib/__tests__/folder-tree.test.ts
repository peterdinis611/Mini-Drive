import { describe, expect, it } from 'vitest'

import {
  buildFolderTree,
  collectExpandableFolderIds,
  flattenFolderRows,
  getAncestorFolderIds,
} from '#/lib/folder-tree'

const folders = [
  { id: 'a', parentId: null, name: 'Alpha', fileCount: 2 },
  { id: 'b', parentId: 'a', name: 'Beta', fileCount: 0 },
  { id: 'c', parentId: 'b', name: 'Charlie', fileCount: 5 },
  { id: 'd', parentId: null, name: 'Delta', fileCount: 1 },
]

describe('buildFolderTree', () => {
  it('nests children and builds path labels', () => {
    const tree = buildFolderTree(folders)
    expect(tree.map((n) => n.name)).toEqual(['Alpha', 'Delta'])
    expect(tree[0]!.children[0]!.name).toBe('Beta')
    expect(tree[0]!.children[0]!.children[0]!.pathLabel).toBe(
      'Alpha / Beta / Charlie',
    )
    expect(tree[0]!.childCount).toBe(1)
    expect(tree[0]!.children[0]!.children[0]!.fileCount).toBe(5)
  })
})

describe('getAncestorFolderIds', () => {
  it('returns root → parent chain', () => {
    expect(getAncestorFolderIds('c', folders)).toEqual(['a', 'b'])
    expect(getAncestorFolderIds('a', folders)).toEqual([])
  })
})

describe('flattenFolderRows', () => {
  it('respects open state and marks active ancestors', () => {
    const tree = buildFolderTree(folders)
    const rows = flattenFolderRows(tree, {
      open: { a: true, b: true },
      activeFolderId: 'c',
    })
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(rows.find((r) => r.id === 'a')?.isAncestorOfActive).toBe(true)
    expect(rows.find((r) => r.id === 'c')?.isActive).toBe(true)
  })

  it('filters by name and keeps matching branches open', () => {
    const tree = buildFolderTree(folders)
    const rows = flattenFolderRows(tree, {
      open: {},
      activeFolderId: null,
      filter: 'char',
    })
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('collectExpandableFolderIds', () => {
  it('lists nodes with children', () => {
    const tree = buildFolderTree(folders)
    expect(collectExpandableFolderIds(tree).sort()).toEqual(['a', 'b'])
  })
})
