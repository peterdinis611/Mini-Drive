import { describe, expect, it } from 'vitest'

import {
  buildBreadcrumbs,
  canMoveFolder,
  collectDescendantIds,
} from './folder-ops'

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
})
