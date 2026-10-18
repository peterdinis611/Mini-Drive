import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'

import {
  deleteFileSchema,
  imagePreviewUrlsSchema,
  moveFileSchema,
  renameFileSchema,
} from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

export const renameFile = createServerFn({ method: 'POST' })
  .validator(renameFileSchema)
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
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .limit(1),
      'Súbor neexistuje',
    )

    return firstOrThrow(
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
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .limit(1),
      'Súbor neexistuje',
    )

    if (data.folderId) {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))
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

export const deleteFile = createServerFn({ method: 'POST' })
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
        .select()
        .from(files)
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .limit(1),
      'Súbor neexistuje',
    )

    if (process.env.UPLOADTHING_TOKEN) {
      await utapi.deleteFiles(existing.uploadthingKey)
    }

    await db
      .delete(files)
      .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))

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
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .limit(1),
      'Súbor neexistuje',
    )

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error('UPLOADTHING_TOKEN nie je nastavený')
    }

    const { ufsUrl } = await utapi.generateSignedURL(existing.uploadthingKey, {
      expiresIn: 60 * 15,
    })

    return { url: ufsUrl, name: existing.name }
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

    const rows = await db
      .select({
        id: files.id,
        mimeType: files.mimeType,
        uploadthingKey: files.uploadthingKey,
      })
      .from(files)
      .where(and(eq(files.userId, userId), inArray(files.id, data.fileIds)))

    const images = rows.filter((row) => row.mimeType.startsWith('image/'))
    const result: Record<string, string> = {}

    await Promise.all(
      images.map(async (row) => {
        const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
          expiresIn: 60 * 10,
        })
        result[row.id] = ufsUrl
      }),
    )

    return result
  })
