import { afterEach, describe, expect, it } from 'vitest'

import {
  clearThemeSynced,
  hasThemeSynced,
  markThemeSynced,
  themeSyncStorageKey,
} from '#/lib/theme-preference'

afterEach(() => {
  sessionStorage.clear()
})

describe('theme sync flags', () => {
  it('marks and reads per-user sync state', () => {
    expect(hasThemeSynced('u1')).toBe(false)
    markThemeSynced('u1')
    expect(hasThemeSynced('u1')).toBe(true)
    expect(sessionStorage.getItem(themeSyncStorageKey('u1'))).toBe('1')
    expect(hasThemeSynced('u2')).toBe(false)
    clearThemeSynced('u1')
    expect(hasThemeSynced('u1')).toBe(false)
  })
})
