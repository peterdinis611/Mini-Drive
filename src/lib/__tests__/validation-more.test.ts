import { describe, expect, it } from 'vitest'

import { AppError } from '#/lib/errors'
import {
  bulkRenamePatternSchema,
  createTagSchema,
  parseServerInput,
  tagNameSchema,
  uniqueIdArraySchema,
  unlockPublicShareSchema,
} from '#/lib/validation'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const UUID_B = '550e8400-e29b-41d4-a716-446655440001'
const UUID_C = '550e8400-e29b-41d4-a716-446655440002'
const UUID_D = '550e8400-e29b-41d4-a716-446655440003'

describe('unlockPublicShareSchema', () => {
  it('requires token + non-empty password', () => {
    expect(
      unlockPublicShareSchema.parse({
        token: 'a'.repeat(16),
        password: 'tajne1',
      }),
    ).toEqual({
      token: 'a'.repeat(16),
      password: 'tajne1',
    })

    expect(() =>
      unlockPublicShareSchema.parse({
        token: 'a'.repeat(16),
        password: '',
      }),
    ).toThrow()

    expect(() =>
      unlockPublicShareSchema.parse({
        token: 'short',
        password: 'tajne1',
      }),
    ).toThrow()
  })
})

describe('uniqueIdArraySchema', () => {
  const schema = uniqueIdArraySchema(1, 3)

  it('accepts unique UUID lists in range', () => {
    expect(schema.parse([UUID])).toEqual([UUID])
    expect(schema.parse([UUID, UUID_B])).toEqual([UUID, UUID_B])
  })

  it('rejects empty, oversized, and duplicates', () => {
    expect(() => schema.parse([])).toThrow()
    expect(() => schema.parse([UUID, UUID_B, UUID_C, UUID_D])).toThrow()
    expect(() => schema.parse([UUID, UUID])).toThrow()
    expect(() => schema.parse(['not-a-uuid'])).toThrow()
  })
})

describe('parseServerInput', () => {
  it('returns parsed data or AppError VALIDATION', () => {
    expect(parseServerInput(tagNameSchema, '  report  ')).toBe('report')
    try {
      parseServerInput(tagNameSchema, '')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('VALIDATION')
    }
  })
})

describe('createTagSchema / tagNameSchema', () => {
  it('trims and bounds tag names', () => {
    expect(createTagSchema.parse({ name: '  Q4  ' })).toEqual({ name: 'Q4' })
    expect(() => tagNameSchema.parse('')).toThrow()
    expect(() => tagNameSchema.parse('x'.repeat(100))).toThrow()
  })
})

describe('bulkRenamePatternSchema', () => {
  it('requires pattern with tokens and file ids', () => {
    expect(
      bulkRenamePatternSchema.parse({
        fileIds: [UUID],
        pattern: '{name}-{n}{ext}',
      }),
    ).toMatchObject({ pattern: '{name}-{n}{ext}' })

    expect(() =>
      bulkRenamePatternSchema.parse({
        fileIds: [UUID],
        pattern: 'plain',
      }),
    ).toThrow()
  })
})
