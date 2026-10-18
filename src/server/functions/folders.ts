import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import {
  buildBreadcrumbs,
  canMoveFolder,
  collectDescendantIds,
} from '#/lib/folder-ops'
import type { FolderNode } from '#/lib/folder-ops'
import {
  createFolderSchema,
  deleteFolderSchema,
  listFolderContentsSchema,
  moveFolderSchema,
  renameFolderSchema,
} from '#/lib/validation'
import { firstOrNull, firstOrThrow } from '#/server/db-helpers.server'

async function loadUserFolders(userId: string): Promise<FolderNode[]> {
  const { db } = await import('#/db')
  const { folders } = await import('#/db/schema')

  return db
    .select({
      id: folders.id,
      parentId: folders.parentId,
      name: folders.name,
    })
    .from(folders)
    .where(eq(folders.userId, userId))
}

export const listFolderContents = createServerFn({ method: 'GET' })
  .validator(listFolderContentsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const folderId = data.folderId

    if (folderId) {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
          .limit(1),
        'Priečinok neexistuje',
      )
    }

    const parentFilter =
      folderId === null
        ? isNull(folders.parentId)
        : eq(folders.parentId, folderId)
    const fileFolderFilter =
      folderId === null ? isNull(files.folderId) : eq(files.folderId, folderId)

    const [childFolders, childFiles, allFolders] = await Promise.all([
      db
        .select({
          id: folders.id,
          name: folders.name,
          parentId: folders.parentId,
          createdAt: folders.createdAt,
        })
        .from(folders)
        .where(and(eq(folders.userId, userId), parentFilter)),
      db
        .select({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          folderId: files.folderId,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(and(eq(files.userId, userId), fileFolderFilter)),
      loadUserFolders(userId),
    ])

    return {
      folderId,
      folders: childFolders,
      files: childFiles,
      breadcrumbs: buildBreadcrumbs(folderId, allFolders),
      allFolders,
      viewPreference:
        (session.user as { viewPreference?: 'grid' | 'list' }).viewPreference ??
        'list',
    }
  })

export const createFolder = createServerFn({ method: 'POST' })
  .validator(createFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    if (data.parentId) {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(and(eq(folders.id, data.parentId), eq(folders.userId, userId)))
          .limit(1),
        'Rodičovský priečinok neexistuje',
      )
    }

    const parentFilter =
      data.parentId === null
        ? isNull(folders.parentId)
        : eq(folders.parentId, data.parentId)

    const duplicate = firstOrNull(
      await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            parentFilter,
            eq(folders.name, data.name),
          ),
        )
        .limit(1),
    )

    if (duplicate) throw new Error('Priečinok s týmto názvom už existuje')

    return firstOrThrow(
      await db
        .insert(folders)
        .values({
          userId,
          parentId: data.parentId,
          name: data.name,
        })
        .returning(),
      'Nepodarilo sa vytvoriť priečinok',
    )
  })

export const renameFolder = createServerFn({ method: 'POST' })
  .validator(renameFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const existing = firstOrThrow(
      await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))
        .limit(1),
      'Priečinok neexistuje',
    )

    const parentFilter =
      existing.parentId === null
        ? isNull(folders.parentId)
        : eq(folders.parentId, existing.parentId)

    const duplicate = firstOrNull(
      await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            parentFilter,
            eq(folders.name, data.name),
          ),
        )
        .limit(1),
    )

    if (duplicate && duplicate.id !== data.folderId) {
      throw new Error('Priečinok s týmto názvom už existuje')
    }

    return firstOrThrow(
      await db
        .update(folders)
        .set({ name: data.name })
        .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))
        .returning(),
      'Priečinok neexistuje',
    )
  })

export const getFolderDeleteSummary = createServerFn({ method: 'GET' })
  .validator(deleteFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const allFolders = await loadUserFolders(userId)
    const owned = allFolders.find((f) => f.id === data.folderId)
    if (!owned) throw new Error('Priečinok neexistuje')

    const ids = collectDescendantIds(data.folderId, allFolders)
    const fileRows = await db
      .select({ id: files.id })
      .from(files)
      .where(and(eq(files.userId, userId), inArray(files.folderId, ids)))

    return {
      folderCount: ids.length,
      fileCount: fileRows.length,
      folderIds: ids,
    }
  })

export const deleteFolder = createServerFn({ method: 'POST' })
  .validator(deleteFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    const session = await requireSession()
    const userId = session.user.id
    const allFolders = await loadUserFolders(userId)
    const owned = allFolders.find((f) => f.id === data.folderId)
    if (!owned) throw new Error('Priečinok neexistuje')

    const ids = collectDescendantIds(data.folderId, allFolders)
    const fileRows = await db
      .select({ id: files.id, uploadthingKey: files.uploadthingKey })
      .from(files)
      .where(and(eq(files.userId, userId), inArray(files.folderId, ids)))

    const keys = fileRows.map((f) => f.uploadthingKey).filter(Boolean)
    if (keys.length > 0 && process.env.UPLOADTHING_TOKEN) {
      await utapi.deleteFiles(keys)
    }

    if (fileRows.length > 0) {
      await db
        .delete(files)
        .where(
          and(
            eq(files.userId, userId),
            inArray(
              files.id,
              fileRows.map((f) => f.id),
            ),
          ),
        )
    }

    await db
      .delete(folders)
      .where(and(eq(folders.userId, userId), inArray(folders.id, ids)))

    return {
      deletedFolders: ids.length,
      deletedFiles: fileRows.length,
    }
  })

export const moveFolder = createServerFn({ method: 'POST' })
  .validator(moveFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const allFolders = await loadUserFolders(userId)
    const owned = allFolders.find((f) => f.id === data.folderId)
    if (!owned) throw new Error('Priečinok neexistuje')

    if (data.newParentId) {
      const parent = allFolders.find((f) => f.id === data.newParentId)
      if (!parent) throw new Error('Cieľový priečinok neexistuje')
    }

    if (!canMoveFolder(data.folderId, data.newParentId, allFolders)) {
      throw new Error('Presun by vytvoril cyklus v priečinkoch')
    }

    const parentFilter =
      data.newParentId === null
        ? isNull(folders.parentId)
        : eq(folders.parentId, data.newParentId)

    const duplicate = firstOrNull(
      await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            parentFilter,
            eq(folders.name, owned.name),
          ),
        )
        .limit(1),
    )

    if (duplicate && duplicate.id !== data.folderId) {
      throw new Error('V cieľovom priečinku už existuje rovnaký názov')
    }

    return firstOrThrow(
      await db
        .update(folders)
        .set({ parentId: data.newParentId })
        .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))
        .returning(),
      'Priečinok neexistuje',
    )
  })
