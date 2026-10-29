import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { FolderNode } from '#/lib/folder-ops'
import {
  buildBreadcrumbs,
  canMoveFolder,
  collectDescendantIds,
} from '#/lib/folder-ops'
import {
  createFolderSchema,
  deleteFolderSchema,
  listFolderContentsSchema,
  moveFolderSchema,
  renameFolderSchema,
  setLastFolderSchema,
  updateFolderStyleSchema,
} from '#/lib/validation'
import { recordActivity } from '#/server/activity.server'
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
    .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))
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
          .where(
            and(
              eq(folders.id, folderId),
              eq(folders.userId, userId),
              isNull(folders.deletedAt),
            ),
          )
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
        .where(
          and(
            eq(folders.userId, userId),
            parentFilter,
            isNull(folders.deletedAt),
          ),
        ),
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
        .where(
          and(
            eq(files.userId, userId),
            fileFolderFilter,
            isNull(files.deletedAt),
          ),
        ),
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
            isNull(folders.deletedAt),
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
            isNull(folders.deletedAt),
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
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.folderId, ids),
        ),
      )

    return {
      folderCount: ids.length,
      fileCount: fileRows.length,
      folderIds: ids,
    }
  })

/** Soft-delete folder tree + contained files into Trash. */
export const deleteFolder = createServerFn({ method: 'POST' })
  .validator(deleteFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id
    const allFolders = await loadUserFolders(userId)
    const owned = allFolders.find((f) => f.id === data.folderId)
    if (!owned) throw new Error('Priečinok neexistuje')

    const ids = collectDescendantIds(data.folderId, allFolders)
    const now = new Date()

    const fileRows = await db
      .select({ id: files.id })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.folderId, ids),
        ),
      )

    await db
      .update(files)
      .set({ deletedAt: now })
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.folderId, ids),
        ),
      )

    await db
      .update(folders)
      .set({ deletedAt: now })
      .where(
        and(
          eq(folders.userId, userId),
          isNull(folders.deletedAt),
          inArray(folders.id, ids),
        ),
      )

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
            isNull(folders.deletedAt),
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

export const setLastFolder = createServerFn({ method: 'POST' })
  .validator(setLastFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders, user } = await import('#/db/schema')

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
        'Priečinok neexistuje',
      )
    }

    await db
      .update(user)
      .set({ lastFolderId: data.folderId })
      .where(eq(user.id, userId))

    return { ok: true as const }
  })

export const updateFolderStyle = createServerFn({ method: 'POST' })
  .validator(updateFolderStyleSchema)
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
            isNull(folders.deletedAt),
          ),
        )
        .limit(1),
      'Priečinok neexistuje',
    )

    await db
      .update(folders)
      .set({
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
      })
      .where(and(eq(folders.id, data.folderId), eq(folders.userId, userId)))

    return { ok: true as const }
  })

/** Soft-delete folders that have no child folders and no active files. */
export const cleanupEmptyFolders = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const allFolders = await db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))

    const fileRows = await db
      .select({ folderId: files.folderId })
      .from(files)
      .where(and(eq(files.userId, userId), isNull(files.deletedAt)))

    const foldersWithFiles = new Set(
      fileRows.map((row) => row.folderId).filter(Boolean) as string[],
    )
    const parents = new Set(
      allFolders.map((folder) => folder.parentId).filter(Boolean) as string[],
    )

    const emptyIds = allFolders
      .filter(
        (folder) => !foldersWithFiles.has(folder.id) && !parents.has(folder.id),
      )
      .map((folder) => folder.id)

    if (emptyIds.length === 0) {
      return { deleted: 0 }
    }

    const now = new Date()
    await db
      .update(folders)
      .set({ deletedAt: now })
      .where(
        and(
          eq(folders.userId, userId),
          isNull(folders.deletedAt),
          inArray(folders.id, emptyIds),
        ),
      )

    await recordActivity({
      userId,
      action: 'folder.cleanup_empty',
      targetType: 'folder',
      summary: `Vyčistených ${emptyIds.length} prázdnych priečinkov`,
      meta: { count: emptyIds.length },
    })

    return { deleted: emptyIds.length }
  },
)

export const listEmptyFolders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const allFolders = await db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))

    const fileRows = await db
      .select({ folderId: files.folderId })
      .from(files)
      .where(and(eq(files.userId, userId), isNull(files.deletedAt)))

    const foldersWithFiles = new Set(
      fileRows.map((row) => row.folderId).filter(Boolean) as string[],
    )
    const parents = new Set(
      allFolders.map((folder) => folder.parentId).filter(Boolean) as string[],
    )

    return allFolders.filter(
      (folder) => !foldersWithFiles.has(folder.id) && !parents.has(folder.id),
    )
  },
)
