import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNotNull, isNull, lte } from 'drizzle-orm'

import { TRASH_RETENTION_DAYS } from '#/lib/constants'
import {
  purgeFileSchema,
  purgeFolderSchema,
  restoreFileSchema,
  restoreFolderSchema,
} from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

export const listTrash = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireSession } = await import('#/server/auth.server')
  const { db } = await import('#/db')
  const { files, folders } = await import('#/db/schema')

  const session = await requireSession()
  const userId = session.user.id

  const [trashedFiles, trashedFolders] = await Promise.all([
    db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        folderId: files.folderId,
        deletedAt: files.deletedAt,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(and(eq(files.userId, userId), isNotNull(files.deletedAt)))
      .orderBy(desc(files.deletedAt)),
    db
      .select({
        id: folders.id,
        name: folders.name,
        parentId: folders.parentId,
        deletedAt: folders.deletedAt,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNotNull(folders.deletedAt)))
      .orderBy(desc(folders.deletedAt)),
  ])

  return {
    files: trashedFiles,
    folders: trashedFolders,
    retentionDays: TRASH_RETENTION_DAYS,
  }
})

export const restoreFile = createServerFn({ method: 'POST' })
  .validator(restoreFileSchema)
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
            isNotNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor v koši neexistuje',
    )

    await db
      .update(files)
      .set({ deletedAt: null })
      .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))

    return { ok: true as const }
  })

export const restoreFolder = createServerFn({ method: 'POST' })
  .validator(restoreFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.id, data.folderId),
            eq(folders.userId, userId),
            isNotNull(folders.deletedAt),
          ),
        )
        .limit(1),
      'Priečinok v koši neexistuje',
    )

    await db
      .update(folders)
      .set({ deletedAt: null })
      .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))

    return { ok: true as const }
  })

async function permanentlyDeleteFile(
  userId: string,
  fileId: string,
): Promise<void> {
  const { db } = await import('#/db')
  const { files, fileVersions } = await import('#/db/schema')
  const { utapi } = await import('#/server/utapi.server')

  const existing = firstOrThrow(
    await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId),
          isNotNull(files.deletedAt),
        ),
      )
      .limit(1),
    'Súbor v koši neexistuje',
  )

  const versions = await db
    .select({ uploadthingKey: fileVersions.uploadthingKey })
    .from(fileVersions)
    .where(eq(fileVersions.fileId, fileId))

  const keys = [
    existing.uploadthingKey,
    ...versions.map((v) => v.uploadthingKey),
  ]

  if (process.env.UPLOADTHING_TOKEN && keys.length > 0) {
    try {
      await utapi.deleteFiles(keys)
    } catch {
      throw new Error('Nepodarilo sa zmazať súbor z úložiska. Skús to znova.')
    }
  }

  await db
    .delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
}

export const purgeFile = createServerFn({ method: 'POST' })
  .validator(purgeFileSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const session = await requireSession()
    await permanentlyDeleteFile(session.user.id, data.fileId)
    return { ok: true as const }
  })

export const purgeFolder = createServerFn({ method: 'POST' })
  .validator(purgeFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.id, data.folderId),
            eq(folders.userId, userId),
            isNotNull(folders.deletedAt),
          ),
        )
        .limit(1),
      'Priečinok v koši neexistuje',
    )

    await db
      .delete(folders)
      .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))

    return { ok: true as const }
  })

/** Soft-delete every active file + folder for the current user into Trash. */
export const deleteAllDriveContent = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const now = new Date()

    const [fileResult, folderResult] = await Promise.all([
      db
        .update(files)
        .set({ deletedAt: now })
        .where(and(eq(files.userId, userId), isNull(files.deletedAt)))
        .returning({ id: files.id }),
      db
        .update(folders)
        .set({ deletedAt: now })
        .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))
        .returning({ id: folders.id }),
    ])

    return {
      ok: true as const,
      deletedFiles: fileResult.length,
      deletedFolders: folderResult.length,
    }
  },
)

export const emptyTrash = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const trashedFiles = await db
      .select({ id: files.id })
      .from(files)
      .where(and(eq(files.userId, userId), isNotNull(files.deletedAt)))

    for (const row of trashedFiles) {
      await permanentlyDeleteFile(userId, row.id)
    }

    await db
      .delete(folders)
      .where(and(eq(folders.userId, userId), isNotNull(folders.deletedAt)))

    return { ok: true as const, purgedFiles: trashedFiles.length }
  },
)

export const purgeExpiredTrash = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const cutoff = new Date(
      Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    )

    const expired = await db
      .select({ id: files.id })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNotNull(files.deletedAt),
          lte(files.deletedAt, cutoff),
        ),
      )

    for (const row of expired) {
      await permanentlyDeleteFile(userId, row.id)
    }

    return { purged: expired.length }
  },
)
