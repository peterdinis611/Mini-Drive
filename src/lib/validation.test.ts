import { describe, expect, it } from 'vitest'

import {
  fileNameSchema,
  isShareLinkActive,
  onboardingPreferencesSchema,
  wouldCreateFolderCycle,
} from './validation'

describe('fileNameSchema', () => {
  it('accepts valid names', () => {
    expect(fileNameSchema.parse('Report Q1')).toBe('Report Q1')
  })

  it('rejects empty, long, and forbidden names', () => {
    expect(() => fileNameSchema.parse('')).toThrow()
    expect(() => fileNameSchema.parse('a/b')).toThrow()
    expect(() => fileNameSchema.parse('.')).toThrow()
    expect(() => fileNameSchema.parse('..')).toThrow()
  })
})

describe('onboardingPreferencesSchema', () => {
  it('validates preferences payload', () => {
    expect(
      onboardingPreferencesSchema.parse({
        name: 'Peter',
        viewPreference: 'grid',
      }),
    ).toEqual({ name: 'Peter', viewPreference: 'grid' })
  })
})

describe('wouldCreateFolderCycle', () => {
  const tree = new Map<string, string | null>([
    ['a', null],
    ['b', 'a'],
    ['c', 'b'],
  ])

  it('detects cycles and allows valid moves', () => {
    expect(wouldCreateFolderCycle('a', 'c', tree)).toBe(true)
    expect(wouldCreateFolderCycle('c', 'a', tree)).toBe(false)
    expect(wouldCreateFolderCycle('b', null, tree)).toBe(false)
    expect(wouldCreateFolderCycle('a', 'a', tree)).toBe(true)
  })
})

describe('isShareLinkActive', () => {
  it('checks expiry and revocation', () => {
    expect(
      isShareLinkActive({
        expiresAt: Date.now() + 60_000,
        revokedAt: null,
      }),
    ).toBe(true)

    expect(
      isShareLinkActive({
        expiresAt: Date.now() - 1,
        revokedAt: null,
      }),
    ).toBe(false)

    expect(
      isShareLinkActive({
        expiresAt: Date.now() + 60_000,
        revokedAt: Date.now(),
      }),
    ).toBe(false)
  })
})
