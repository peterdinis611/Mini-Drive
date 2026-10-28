import { describe, expect, it } from 'vitest'

import { appHotkeys } from '#/lib/app-hotkeys'

describe('appHotkeys', () => {
  it('declares search and drive actions', () => {
    expect(appHotkeys['search.open'].hotkey).toBe('Mod+K')
    expect(appHotkeys['files.upload'].hotkey).toBe('Mod+U')
    expect(appHotkeys['files.new-folder'].hotkey).toBe('Mod+Shift+N')
    expect(appHotkeys['nav.settings'].hotkey).toBe('Mod+,')
  })

  it('groups navigation sequences under Navigácia', () => {
    expect(appHotkeys['nav.files'].meta?.group).toBe('Navigácia')
    expect(appHotkeys['nav.files'].hotkey).toEqual(['G', 'F'])
  })
})
