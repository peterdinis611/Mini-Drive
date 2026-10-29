import { afterEach, describe, expect, it } from 'vitest'

import {
  HOTKEYS_STORAGE_KEY,
  loadCustomHotkeys,
  parseCustomHotkeys,
  saveCustomHotkeys,
  serializeCustomHotkeys,
} from '#/lib/hotkeys-storage'

describe('parseCustomHotkeys', () => {
  it('returns empty for blank / invalid JSON', () => {
    expect(parseCustomHotkeys(null)).toEqual({})
    expect(parseCustomHotkeys('')).toEqual({})
    expect(parseCustomHotkeys('not-json')).toEqual({})
    expect(parseCustomHotkeys('[]')).toEqual({})
    expect(parseCustomHotkeys('null')).toEqual({})
  })

  it('keeps object maps', () => {
    expect(parseCustomHotkeys('{"search.open":"mod+k"}')).toEqual({
      'search.open': 'mod+k',
    })
  })
})

describe('serializeCustomHotkeys', () => {
  it('round-trips through JSON', () => {
    const custom = { 'search.open': 'mod+k', 'files.upload': 'mod+u' }
    expect(JSON.parse(serializeCustomHotkeys(custom))).toEqual(custom)
  })
})

describe('load / save custom hotkeys', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('loads empty when unset', () => {
    expect(loadCustomHotkeys()).toEqual({})
  })

  it('persists and reloads', () => {
    saveCustomHotkeys({ 'search.open': 'mod+/' })
    expect(window.localStorage.getItem(HOTKEYS_STORAGE_KEY)).toContain('mod+/')
    expect(loadCustomHotkeys()).toEqual({ 'search.open': 'mod+/' })
  })

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem(HOTKEYS_STORAGE_KEY, '{broken')
    expect(loadCustomHotkeys()).toEqual({})
  })
})
