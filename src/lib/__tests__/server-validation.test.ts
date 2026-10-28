import { describe, expect, it } from 'vitest'

import { AppError } from '#/lib/errors'
import {
  DELETE_ALL_CONFIRM_WORD,
  EMPTY_TRASH_CONFIRM_WORD,
  bulkMoveFilesSchema,
  deleteAllDriveSchema,
  emptyTrashSchema,
  fileIdsSchema,
  parseServerInput,
  uploadInputSchema,
} from '#/lib/validation'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const UUID2 = '550e8400-e29b-41d4-a716-446655440001'

describe('unique file id lists', () => {
  it('rejects duplicates', () => {
    expect(() =>
      fileIdsSchema.parse({ fileIds: [UUID, UUID] }),
    ).toThrow(/duplicitné/i)
    expect(() =>
      bulkMoveFilesSchema.parse({
        fileIds: [UUID, UUID],
        folderId: null,
      }),
    ).toThrow(/duplicitné/i)
  })

  it('accepts unique ids', () => {
    expect(
      fileIdsSchema.parse({ fileIds: [UUID, UUID2] }).fileIds,
    ).toHaveLength(2)
  })
})

describe('destructive confirm schemas', () => {
  it('requires delete-all confirm word (case-insensitive sk)', () => {
    expect(
      deleteAllDriveSchema.parse({ confirm: 'zmazať' }),
    ).toEqual({ confirm: DELETE_ALL_CONFIRM_WORD })
    expect(() =>
      deleteAllDriveSchema.parse({ confirm: 'ano' }),
    ).toThrow()
  })

  it('requires empty-trash confirm word', () => {
    expect(
      emptyTrashSchema.parse({ confirm: 'vyprázdniť' }),
    ).toEqual({ confirm: EMPTY_TRASH_CONFIRM_WORD })
    expect(() => emptyTrashSchema.parse({ confirm: 'ok' })).toThrow()
  })
})

describe('uploadInputSchema', () => {
  it('normalizes nullish folder/replace/saveAsName', () => {
    expect(uploadInputSchema.parse({})).toMatchObject({
      folderId: null,
      saveAsName: null,
    })
    expect(
      uploadInputSchema.parse({
        folderId: UUID,
        saveAsName: 'report.pdf',
      }),
    ).toMatchObject({
      folderId: UUID,
      saveAsName: 'report.pdf',
    })
  })

  it('rejects forbidden saveAsName', () => {
    expect(() =>
      uploadInputSchema.parse({ saveAsName: 'a/b.pdf' }),
    ).toThrow()
  })
})

describe('parseServerInput', () => {
  it('throws AppError with Slovak message', () => {
    expect(() => parseServerInput(fileIdsSchema, { fileIds: [] })).toThrow(
      AppError,
    )
    try {
      parseServerInput(fileIdsSchema, { fileIds: [] })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('VALIDATION')
      expect((error as AppError).message.length).toBeGreaterThan(0)
    }
  })
})
