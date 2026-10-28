import { describe, expect, it } from 'vitest'

import {
  changePasswordSchema,
  createShareLinkSchema,
  registerSchema,
  revokeShareLinkSchema,
  shareTokenSchema,
} from '#/lib/validation'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('registerSchema', () => {
  it('accepts email + strong password (name optional)', () => {
    expect(
      registerSchema.parse({
        email: 'nova@example.com',
        password: '123456789012',
      }),
    ).toEqual({
      name: '',
      email: 'nova@example.com',
      password: '123456789012',
    })
  })

  it('rejects weak passwords on register', () => {
    expect(() =>
      registerSchema.parse({
        email: 'nova@example.com',
        password: 'short',
      }),
    ).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('requires matching confirmation', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'old-password-1',
        newPassword: '123456789012',
        confirmPassword: '123456789013',
      }),
    ).toThrow(/nezhodujú/i)
  })

  it('accepts a valid change payload', () => {
    expect(
      changePasswordSchema.parse({
        currentPassword: 'old-password-1',
        newPassword: '123456789012',
        confirmPassword: '123456789012',
      }),
    ).toMatchObject({
      newPassword: '123456789012',
    })
  })
})

describe('share schemas', () => {
  it('validates create/revoke share payloads', () => {
    expect(
      createShareLinkSchema.parse({ fileId: UUID, expiresIn: 3600 }),
    ).toEqual({ fileId: UUID, expiresIn: 3600 })

    expect(
      createShareLinkSchema.parse({
        fileId: UUID,
        expiresIn: 3600,
        password: 'secret1',
      }),
    ).toMatchObject({ password: 'secret1' })

    expect(() =>
      createShareLinkSchema.parse({
        fileId: UUID,
        expiresIn: 3600,
        password: 'short',
      }),
    ).toThrow()

    expect(() =>
      createShareLinkSchema.parse({ fileId: 'not-uuid', expiresIn: 3600 }),
    ).toThrow()

    expect(revokeShareLinkSchema.parse({ shareId: UUID })).toEqual({
      shareId: UUID,
    })
  })

  it('validates share tokens', () => {
    expect(shareTokenSchema.parse('a'.repeat(16))).toHaveLength(16)
    expect(() => shareTokenSchema.parse('short')).toThrow()
    expect(() => shareTokenSchema.parse('bad token!!')).toThrow()
  })
})
