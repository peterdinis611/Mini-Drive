import { describe, expect, it } from 'vitest'

import {
  buildBreadcrumbs,
  buildParentMap,
  canMoveFolder,
  collectDescendantIds,
  formatFolderPath,
} from '../folder-ops'

const nodes = [
  { id: 'a', parentId: null, name: 'A' },
  { id: 'b', parentId: 'a', name: 'B' },
  { id: 'c', parentId: 'b', name: 'C' },
  { id: 'd', parentId: null, name: 'D' },
]

describe('folder-ops', () => {
  it('collects descendants including self', () => {
    expect(collectDescendantIds('a', nodes).sort()).toEqual(['a', 'b', 'c'])
  })

  it('blocks cyclic moves', () => {
    expect(canMoveFolder('a', 'c', nodes)).toBe(false)
    expect(canMoveFolder('c', 'd', nodes)).toBe(true)
  })

  it('builds breadcrumbs', () => {
    expect(buildBreadcrumbs('c', nodes)).toEqual([
      { id: null, name: 'Súbory' },
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ])
  })

  it('formats human folder paths', () => {
    expect(formatFolderPath(nodes[2]!, nodes)).toBe('A / B / C')
    expect(formatFolderPath(nodes[3]!, nodes)).toBe('D')
  })

  it('builds parent maps and root breadcrumbs', () => {
    expect(buildParentMap(nodes).get('b')).toBe('a')
    expect(buildParentMap(nodes).get('a')).toBeNull()
    expect(buildBreadcrumbs(null, nodes)).toEqual([
      { id: null, name: 'Súbory' },
    ])
  })

  it('stops breadcrumb trail on orphan parents', () => {
    const orphan = [
      { id: 'x', parentId: 'missing', name: 'X' },
      { id: 'y', parentId: 'x', name: 'Y' },
    ]
    expect(buildBreadcrumbs('y', orphan)).toEqual([
      { id: null, name: 'Súbory' },
      { id: 'x', name: 'X' },
      { id: 'y', name: 'Y' },
    ])
  })
})
