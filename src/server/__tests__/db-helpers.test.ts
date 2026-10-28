import { describe, expect, it } from 'vitest'

import { firstOrNull, firstOrThrow } from '#/server/db-helpers.server'

describe('firstOrThrow', () => {
  it('returns the first row', () => {
    expect(firstOrThrow([{ id: 1 }, { id: 2 }], 'missing')).toEqual({ id: 1 })
  })

  it('throws when empty', () => {
    expect(() => firstOrThrow([], 'Súbor neexistuje')).toThrow(
      'Súbor neexistuje',
    )
  })
})

describe('firstOrNull', () => {
  it('returns first or null', () => {
    expect(firstOrNull(['a'])).toBe('a')
    expect(firstOrNull([])).toBeNull()
  })
})
