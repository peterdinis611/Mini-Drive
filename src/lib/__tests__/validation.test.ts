import { describe, expect, it } from 'vitest'

import {
  emailSchema,
  fileNameSchema,
  isShareLinkActive,
  loginSchema,
  onboardingPreferencesSchema,
  passwordSchema,
  updateSettingsSchema,
  validateFilesForUpload,
  wouldCreateFolderCycle,
} from '../validation'

describe('fileNameSchema', () => {
  it('accepts valid names', () => {
    expect(fileNameSchema.parse('Report Q1')).toBe('Report Q1')
  })

  it('rejects empty, long, forbidden and reserved names', () => {
    expect(() => fileNameSchema.parse('')).toThrow()
    expect(() => fileNameSchema.parse('a/b')).toThrow()
    expect(() => fileNameSchema.parse('.')).toThrow()
    expect(() => fileNameSchema.parse('..')).toThrow()
    expect(() => fileNameSchema.parse('con')).toThrow()
    expect(() => fileNameSchema.parse('notes.')).toThrow()
  })
})

describe('auth schemas', () => {
  it('validates email and password', () => {
    expect(emailSchema.parse('a@b.sk')).toBe('a@b.sk')
    expect(() => emailSchema.parse('not-email')).toThrow()
    expect(() => passwordSchema.parse('short')).toThrow()
    expect(loginSchema.parse({ email: 'a@b.sk', password: '12345678' })).toEqual(
      {
        email: 'a@b.sk',
        password: '12345678',
      },
    )
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

describe('updateSettingsSchema', () => {
  it('requires at least one field', () => {
    expect(() => updateSettingsSchema.parse({})).toThrow()
    expect(
      updateSettingsSchema.parse({ name: 'Peter', viewPreference: 'list' }),
    ).toEqual({ name: 'Peter', viewPreference: 'list' })
  })
})

describe('validateFilesForUpload', () => {
  it('rejects empty selection and empty files', () => {
    expect(validateFilesForUpload([])).toEqual({
      ok: false,
      message: 'Nevybral si žiadny súbor',
    })
    expect(
      validateFilesForUpload([new File([], 'empty.txt', { type: 'text/plain' })]),
    ).toMatchObject({ ok: false })
  })

  it('accepts a normal file', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    const result = validateFilesForUpload([file])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.files).toHaveLength(1)
    }
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
