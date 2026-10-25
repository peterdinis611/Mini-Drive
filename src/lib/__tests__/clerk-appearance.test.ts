import { describe, expect, it } from 'vitest'

import {
  clerkAppearance,
  clerkAppearanceDark,
  clerkAppearanceLight,
} from '#/lib/clerk-appearance'

const SEMANTIC_THEME_CLASS =
  /\b(?:bg|text|border)-(?:card|background|foreground|muted|primary|border|accent)(?:\/|\b)/

describe('clerkAppearance', () => {
  it('defaults to the dark industrial palette', () => {
    expect(clerkAppearance).toBe(clerkAppearanceDark)
    expect(clerkAppearanceDark.variables.colorBackground).toBe('#161a22')
    expect(clerkAppearanceDark.variables.colorText).toBe('#e8eaed')
  })

  it('uses an explicit light palette with dark text on light surfaces', () => {
    expect(clerkAppearanceLight.variables.colorBackground).toBe('#f1f2f4')
    expect(clerkAppearanceLight.variables.colorText).toBe('#12141a')
    expect(clerkAppearanceLight.variables.colorInputText).toBe('#12141a')
  })

  it('avoids Tailwind semantic theme classes that flip under .dark', () => {
    for (const appearance of [clerkAppearanceDark, clerkAppearanceLight]) {
      for (const value of Object.values(appearance.elements)) {
        expect(value).not.toMatch(SEMANTIC_THEME_CLASS)
      }
    }
  })
})
