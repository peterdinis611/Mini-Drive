import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm'

import { applyRenamePattern } from '#/lib/batch-rename'
import {
  bulkMoveFilesSchema,
  bulkRenamePatternSchema,
  checkUploadConflictsSchema,
  deleteFileSchema,
  fileIdsSchema,
  imagePreviewUrlsSchema,
  listFileVersionsSchema,
  moveFileSchema,
  renameFileSchema,
  restoreFileVersionSchema,
} from '#/lib/validation'
import { firstOrNull, firstOrThrow } from '#/server/db-helpers.server'
import { recordActivity } from '#/server/activity.server'
import { nextFileVersionNumber } from '#/server/storage.server'

export const renameFile = createServerFn({ method: 'POST' })
  .validator(renameFileSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const existing = firstOrThrow(
      await db
        .select({ id: files.id, folderId: files.folderId })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    const folderFilter =
      existing.folderId === null
        ? isNull(files.folderId)
        : eq(files.folderId, existing.folderId)

    const duplicate = firstOrNull(
      await db
        .select({ id: files.id })
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            folderFilter,
            eq(files.name, data.name),
            ne(files.id, data.fileId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
    )

    if (duplicate) {
      throw new Error('V tomto priečinku už existuje súbor s týmto názvom')
    }

    const renamed = firstOrThrow(
      await db
        .update(files)
        .set({ name: data.name })
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .returning({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          folderId: files.folderId,
          createdAt: files.createdAt,
        }),
      'Súbor neexistuje',
    )

    await recordActivity({
      userId,
      action: 'file.rename',
      targetType: 'file',
      targetId: renamed.id,
      summary: `Premenovaný na „${renamed.name}“`,
    })

    return renamed
  })

export const bulkRenameFiles = createServerFn({ method: 'POST' })
  .validator(bulkRenamePatternSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const startAt = data.startAt ?? 1

    const rows = await db
      .select({
        id: files.id,
        name: files.name,
        folderId: files.folderId,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.id, data.fileIds),
        ),
      )

    if (rows.length === 0) throw new Error('Žiadne súbory na premenovanie')

    const byId = new Map(rows.map((row) => [row.id, row]))
    const ordered = data.fileIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))

    const updates: Array<{ id: string; name: string }> = []
    for (let i = 0; i < ordered.length; i += 1) {
      const row = ordered[i]!
      const nextName = applyRenamePattern(row.name, data.pattern, startAt + i)
      if (!nextName.trim()) {
        throw new Error('Vzor vytvoril prázdny názov')
      }
      updates.push({ id: row.id, name: nextName })
    }

    // Collision check within batch + existing folder siblings
    const proposed = new Set<string>()
    for (const update of updates) {
      const key = `${byId.get(update.id)?.folderId ?? 'root'}::${update.name}`
      if (proposed.has(key)) {
        throw new Error(`Konflikt názvov v dávke: ${update.name}`)
      }
      proposed.add(key)
    }

    for (const update of updates) {
      const current = byId.get(update.id)!
      const folderFilter =
        current.folderId === null
          ? isNull(files.folderId)
          : eq(files.folderId, current.folderId)
      const clash = firstOrNull(
        await db
          .select({ id: files.id })
          .from(files)
          .where(
            and(
              eq(files.userId, userId),
              folderFilter,
              eq(files.name, update.name),
              ne(files.id, update.id),
              isNull(files.deletedAt),
            ),
          )
          .limit(1),
      )
      if (clash) {
        throw new Error(`Názov „${update.name}“ už existuje`)
      }
    }

    for (const update of updates) {
      await db
        .update(files)
        .set({ name: update.name })
        .where(and(eq(files.id, update.id), eq(files.userId, userId)))
    }

    await recordActivity({
      userId,
      action: 'file.bulk_rename',
      targetType: 'file',
      summary: `Hromadné premenovanie (${updates.length})`,
      meta: { pattern: data.pattern, count: updates.length },
    })

    return { ok: true as const, count: updates.length, updates }
  })

export const checkUploadConflicts = createServerFn({ method: 'POST' })
  .validator(checkUploadConflictsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const folderFilter =
      data.folderId === null
        ? isNull(files.folderId)
        : eq(files.folderId, data.folderId)

    const existing = await db
      .select({ id: files.id, name: files.name })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          folderFilter,
          isNull(files.deletedAt),
          inArray(files.name, data.names),
        ),
      )

    const byName = new Map(existing.map((row) => [row.name, row.id]))
    return data.names
      .filter((name) => byName.has(name))
      .map((name) => ({ name, fileId: byName.get(name)! }))
  })

export const moveFile = createServerFn({ method: 'POST' })
  .validator(moveFileSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: files.id })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    if (data.folderId) {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(
            and(
              eq(folders.id, data.folderId),
              eq(folders.userId, userId),
              isNull(folders.deletedAt),
            ),
          )
          .limit(1),
        'Cieľový priečinok neexistuje',
      )
    }

    return firstOrThrow(
      await db
        .update(files)
        .set({ folderId: data.folderId })
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .returning({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          folderId: files.folderId,
          createdAt: files.createdAt,
        }),
      'Súbor neexistuje',
    )
  })

/** Soft-delete — file moves to Trash; UploadThing blob kept until purge. */
export const deleteFile = createServerFn({ method: 'POST' })
  .validator(deleteFileSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: files.id })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))

    return { ok: true as const }
  })

export const bulkDeleteFiles = createServerFn({ method: 'POST' })
  .validator(fileIdsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.id, data.fileIds),
        ),
      )

    return { ok: true as const, count: data.fileIds.length }
  })

export const bulkMoveFiles = createServerFn({ method: 'POST' })
  .validator(bulkMoveFilesSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    if (data.folderId) {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(
            and(
              eq(folders.id, data.folderId),
              eq(folders.userId, userId),
              isNull(folders.deletedAt),
            ),
          )
          .limit(1),
        'Cieľový priečinok neexistuje',
      )
    }

    await db
      .update(files)
      .set({ folderId: data.folderId })
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.id, data.fileIds),
        ),
      )

    return { ok: true as const, count: data.fileIds.length }
  })

export const listFileVersions = createServerFn({ method: 'GET' })
  .validator(listFileVersionsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, fileVersions } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const file = firstOrThrow(
      await db
        .select({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          currentVersion: files.currentVersion,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    const versions = await db
      .select({
        id: fileVersions.id,
        version: fileVersions.version,
        name: fileVersions.name,
        size: fileVersions.size,
        mimeType: fileVersions.mimeType,
        createdAt: fileVersions.createdAt,
      })
      .from(fileVersions)
      .where(eq(fileVersions.fileId, data.fileId))
      .orderBy(desc(fileVersions.version))

    return { current: file, versions }
  })

/**
 * Promote an archived version to current: archive today's blob, then swap keys.
 */
export const restoreFileVersion = createServerFn({ method: 'POST' })
  .validator(restoreFileVersionSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, fileVersions } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const current = firstOrThrow(
      await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    const archived = firstOrThrow(
      await db
        .select()
        .from(fileVersions)
        .where(
          and(
            eq(fileVersions.id, data.versionId),
            eq(fileVersions.fileId, data.fileId),
          ),
        )
        .limit(1),
      'Verzia neexistuje',
    )

    const nextVersion = await nextFileVersionNumber(data.fileId)

    await db.insert(fileVersions).values({
      fileId: data.fileId,
      version: nextVersion,
      name: current.name,
      size: current.size,
      mimeType: current.mimeType,
      uploadthingKey: current.uploadthingKey,
    })

    await db
      .update(files)
      .set({
        uploadthingKey: archived.uploadthingKey,
        size: archived.size,
        mimeType: archived.mimeType,
        name: archived.name,
        currentVersion: archived.version,
      })
      .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))

    await db
      .delete(fileVersions)
      .where(eq(fileVersions.id, data.versionId))

    return { ok: true as const }
  })

export const getFileDownloadUrl = createServerFn({ method: 'GET' })
  .validator(deleteFileSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    const session = await requireSession()
    const userId = session.user.id

    const existing = firstOrThrow(
      await db
        .select({
          uploadthingKey: files.uploadthingKey,
          name: files.name,
        })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error('Úložisko nie je nakonfigurované (chýba token).')
    }

    try {
      const { ufsUrl } = await utapi.generateSignedURL(
        existing.uploadthingKey,
        {
          expiresIn: 60 * 15,
        },
      )
      return { url: ufsUrl, name: existing.name }
    } catch {
      throw new Error('Nepodarilo sa pripraviť odkaz na stiahnutie.')
    }
  })

/** Short-lived signed URLs for image thumbnails (grid view). */
export const getImagePreviewUrls = createServerFn({ method: 'POST' })
  .validator(imagePreviewUrlsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    const session = await requireSession()
    const userId = session.user.id

    const empty: Record<string, string> = {}

    if (data.fileIds.length === 0 || !process.env.UPLOADTHING_TOKEN) {
      return empty
    }

    const { isImageMimeType } = await import('#/lib/mime')

    const named = await db
      .select({
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        uploadthingKey: files.uploadthingKey,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.id, data.fileIds),
        ),
      )

    const previewable = named.filter((row) =>
      isImageMimeType(row.mimeType, row.name),
    )
    const result: Record<string, string> = {}

    await Promise.all(
      previewable.map(async (row) => {
        try {
          const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
            expiresIn: 60 * 10,
          })
          if (ufsUrl) result[row.id] = ufsUrl
        } catch {
          // Skip broken previews — UI falls back to icons.
        }
      }),
    )

    return result
  })
