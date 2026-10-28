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

  it('uses an explicit dark slate/blue palette', () => {
    expect(clerkAppearanceDark.variables.colorBackground).toBe('#1a2030')
    expect(clerkAppearanceDark.variables.colorText).toBe('#eef3f8')
    expect(clerkAppearanceDark.variables.colorPrimary).toBe('#7eb8ff')
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
