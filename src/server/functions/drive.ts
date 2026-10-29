import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, isNull, sum } from 'drizzle-orm'

import { STORAGE_QUOTA_BYTES } from '#/lib/constants'
import { firstOrThrow } from '#/server/db-helpers.server'

export const getAppChrome = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders, user } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const fileStatsRows = await db
      .select({
        fileCount: count(files.id),
        totalBytes: sum(files.size),
      })
      .from(files)
      .where(and(eq(files.userId, userId), isNull(files.deletedAt)))

    const folderStatsRows = await db
      .select({
        folderCount: count(folders.id),
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))

    const folderTree = await db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
        color: folders.color,
        priority: folders.priority,
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))

    const fileCountRows = await db
      .select({
        folderId: files.folderId,
        fileCount: count(files.id),
      })
      .from(files)
      .where(and(eq(files.userId, userId), isNull(files.deletedAt)))
      .groupBy(files.folderId)

    const fileCountByFolder = new Map<string, number>()
    for (const row of fileCountRows) {
      if (row.folderId) {
        fileCountByFolder.set(row.folderId, Number(row.fileCount))
      }
    }

    const profile = firstOrThrow(
      await db
        .select({
          name: user.name,
          email: user.email,
          viewPreference: user.viewPreference,
          themePreference: user.themePreference,
          defaultShareExpiresIn: user.defaultShareExpiresIn,
          confirmDelete: user.confirmDelete,
          customHotkeys: user.customHotkeys,
          lastFolderId: user.lastFolderId,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1),
      'User not found',
    )

    const fileStats = fileStatsRows.at(0)
    const folderStats = folderStatsRows.at(0)

    const sortedFolders = [...folderTree].sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0) ||
        a.name.localeCompare(b.name, 'sk'),
    )

    return {
      user: {
        id: userId,
        name: profile.name,
        email: profile.email,
        viewPreference: profile.viewPreference,
        themePreference: profile.themePreference,
        defaultShareExpiresIn: profile.defaultShareExpiresIn,
        confirmDelete: profile.confirmDelete,
        customHotkeys: profile.customHotkeys,
        lastFolderId: profile.lastFolderId,
      },
      folders: sortedFolders.map((folder) => ({
        ...folder,
        fileCount: fileCountByFolder.get(folder.id) ?? 0,
      })),
      stats: {
        fileCount: Number(fileStats?.fileCount ?? 0),
        folderCount: Number(folderStats?.folderCount ?? 0),
        totalBytes: Number(fileStats?.totalBytes ?? 0),
        quotaBytes: STORAGE_QUOTA_BYTES,
      },
    }
  },
)

export const getDriveStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const chrome = await getAppChrome()
    return chrome.stats
  },
)

export const listRecentFiles = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()

    return db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        folderId: files.folderId,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(and(eq(files.userId, session.user.id), isNull(files.deletedAt)))
      .orderBy(desc(files.createdAt))
      .limit(40)
  },
)

/** Full index of folders + files for client-side Fuse.js search. */
export const getDriveSearchIndex = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const [folderRows, fileRows] = await Promise.all([
      db
        .select({
          id: folders.id,
          parentId: folders.parentId,
          name: folders.name,
        })
        .from(folders)
        .where(and(eq(folders.userId, userId), isNull(folders.deletedAt))),
      db
        .select({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          folderId: files.folderId,
          contentText: files.contentText,
        })
        .from(files)
        .where(and(eq(files.userId, userId), isNull(files.deletedAt)))
        .orderBy(desc(files.createdAt))
        .limit(500),
    ])

    return { folders: folderRows, files: fileRows }
  },
)
