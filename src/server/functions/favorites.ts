import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import { favoriteTargetSchema } from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

export const listFavorites = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { favorites, files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const rows = await db
      .select({
        id: favorites.id,
        targetType: favorites.targetType,
        targetId: favorites.targetId,
        createdAt: favorites.createdAt,
      })
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))

    const fileIds = rows
      .filter((row) => row.targetType === 'file')
      .map((row) => row.targetId)
    const folderIds = rows
      .filter((row) => row.targetType === 'folder')
      .map((row) => row.targetId)

    const [fileRows, folderRows] = await Promise.all([
      fileIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: files.id,
              name: files.name,
              mimeType: files.mimeType,
              size: files.size,
              folderId: files.folderId,
            })
            .from(files)
            .where(
              and(
                eq(files.userId, userId),
                isNull(files.deletedAt),
                inArray(files.id, fileIds),
              ),
            ),
      folderIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: folders.id,
              name: folders.name,
              parentId: folders.parentId,
            })
            .from(folders)
            .where(
              and(
                eq(folders.userId, userId),
                isNull(folders.deletedAt),
                inArray(folders.id, folderIds),
              ),
            ),
    ])

    const filesById = new Map(fileRows.map((row) => [row.id, row]))
    const foldersById = new Map(folderRows.map((row) => [row.id, row]))

    return rows
      .map((row) => {
        if (row.targetType === 'file') {
          const file = filesById.get(row.targetId)
          if (!file) return null
          return {
            id: row.id,
            targetType: 'file' as const,
            targetId: row.targetId,
            createdAt: row.createdAt,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            folderId: file.folderId,
          }
        }
        const folder = foldersById.get(row.targetId)
        if (!folder) return null
        return {
          id: row.id,
          targetType: 'folder' as const,
          targetId: row.targetId,
          createdAt: row.createdAt,
          name: folder.name,
          parentId: folder.parentId,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
  },
)

export const toggleFavorite = createServerFn({ method: 'POST' })
  .validator(favoriteTargetSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { favorites, files, folders } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    if (data.targetType === 'file') {
      firstOrThrow(
        await db
          .select({ id: files.id })
          .from(files)
          .where(
            and(
              eq(files.id, data.targetId),
              eq(files.userId, userId),
              isNull(files.deletedAt),
            ),
          )
          .limit(1),
        'Súbor neexistuje',
      )
    } else {
      firstOrThrow(
        await db
          .select({ id: folders.id })
          .from(folders)
          .where(
            and(
              eq(folders.id, data.targetId),
              eq(folders.userId, userId),
              isNull(folders.deletedAt),
            ),
          )
          .limit(1),
        'Priečinok neexistuje',
      )
    }

    const existing = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.targetType, data.targetType),
          eq(favorites.targetId, data.targetId),
        ),
      )
      .limit(1)

    if (existing[0]) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id))
      return { favorited: false as const }
    }

    await db.insert(favorites).values({
      userId,
      targetType: data.targetType,
      targetId: data.targetId,
    })
    return { favorited: true as const }
  })
