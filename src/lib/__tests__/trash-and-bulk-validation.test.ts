import { describe, expect, it } from 'vitest'
import { SHARE_EXPIRY_PRESETS } from '#/lib/constants'
import {
  bulkMoveFilesSchema,
  bulkShareFilesSchema,
  fileIdsSchema,
  listFileVersionsSchema,
  purgeFileSchema,
  restoreFileSchema,
  restoreFileVersionSchema,
  restoreFolderSchema,
} from '#/lib/validation'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const uuid2 = '550e8400-e29b-41d4-a716-446655440001'

describe('fileIdsSchema (bulk delete)', () => {
  it('requires 1–50 valid uuids', () => {
    expect(fileIdsSchema.parse({ fileIds: [uuid] })).toEqual({
      fileIds: [uuid],
    })
    expect(() => fileIdsSchema.parse({ fileIds: [] })).toThrow()
    expect(() => fileIdsSchema.parse({ fileIds: ['not-uuid'] })).toThrow()
    expect(() =>
      fileIdsSchema.parse({
        fileIds: Array.from({ length: 51 }, () => uuid),
      }),
    ).toThrow()
  })
})

describe('bulkMoveFilesSchema', () => {
  it('allows nullable target folder', () => {
    expect(
      bulkMoveFilesSchema.parse({ fileIds: [uuid], folderId: null }),
    ).toEqual({ fileIds: [uuid], folderId: null })
    expect(
      bulkMoveFilesSchema.parse({ fileIds: [uuid, uuid2], folderId: uuid }),
    ).toMatchObject({ folderId: uuid })
  })
})

describe('bulkShareFilesSchema', () => {
  it('caps at 20 files and requires preset expiry', () => {
    expect(
      bulkShareFilesSchema.parse({
        fileIds: [uuid],
        expiresIn: SHARE_EXPIRY_PRESETS[0].value,
      }),
    ).toMatchObject({ fileIds: [uuid] })

    expect(() =>
      bulkShareFilesSchema.parse({
        fileIds: [uuid],
        expiresIn: 999,
      }),
    ).toThrow()

    expect(() =>
      bulkShareFilesSchema.parse({
        fileIds: Array.from({ length: 21 }, () => uuid),
        expiresIn: SHARE_EXPIRY_PRESETS[0].value,
      }),
    ).toThrow()
  })
})

describe('trash schemas', () => {
  it('restore / purge require uuid', () => {
    expect(restoreFileSchema.parse({ fileId: uuid })).toEqual({ fileId: uuid })
    expect(restoreFolderSchema.parse({ folderId: uuid })).toEqual({
      folderId: uuid,
    })
    expect(purgeFileSchema.parse({ fileId: uuid })).toEqual({ fileId: uuid })
    expect(() => restoreFileSchema.parse({ fileId: 'x' })).toThrow()
  })
})

describe('version schemas', () => {
  it('list and restore version payloads', () => {
    expect(listFileVersionsSchema.parse({ fileId: uuid })).toEqual({
      fileId: uuid,
    })
    expect(
      restoreFileVersionSchema.parse({
        fileId: uuid,
        versionId: uuid2,
      }),
    ).toEqual({ fileId: uuid, versionId: uuid2 })
  })
})
