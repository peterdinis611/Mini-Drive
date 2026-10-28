import { describe, expect, it } from 'vitest'

import {
  clerkAppearance,
  clerkAppearanceDark,
  clerkAppearanceLight,
} from '#/lib/clerk-appearance'

const SEMANTIC_THEME_CLASS =
  /\b(?:bg|text|border)-(?:card|background|foreground|muted|primary|border|accent)(?:\/|\b)/

describe('clerkAppearance', () => {
  it('defaults to the light landing palette', () => {
    expect(clerkAppearance).toBe(clerkAppearanceLight)
    expect(clerkAppearanceLight.variables.colorBackground).toBe('#ffffff')
    expect(clerkAppearanceLight.variables.colorPrimary).toBe('#b6ec2e')
  })

  it('uses an explicit dark slate/violet palette', () => {
    expect(clerkAppearanceDark.variables.colorBackground).toBe('#1c1f2c')
    expect(clerkAppearanceDark.variables.colorText).toBe('#f2efe8')
    expect(clerkAppearanceDark.variables.colorPrimary).toBe('#b9a6ff')
  })

  it('uses an explicit light palette with dark text on light surfaces', () => {
    expect(clerkAppearanceLight.variables.colorBackground).toBe('#ffffff')
    expect(clerkAppearanceLight.variables.colorText).toBe('#071820')
    expect(clerkAppearanceLight.variables.colorInputText).toBe('#071820')
  })

  it('avoids Tailwind semantic theme classes that flip under .dark', () => {
    for (const appearance of [clerkAppearanceDark, clerkAppearanceLight]) {
      for (const value of Object.values(appearance.elements)) {
        expect(value).not.toMatch(SEMANTIC_THEME_CLASS)
      }
    }
  })
})
