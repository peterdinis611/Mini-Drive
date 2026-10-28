import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'

export type DuplicateGroup = {
  contentHash: string
  totalSize: number
  files: Array<{
    id: string
    name: string
    size: number
    mimeType: string
    folderId: string | null
    createdAt: Date
  }>
}

/** Groups active files that share the same content hash (2+ copies). */
export const listDuplicateGroups = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DuplicateGroup[]> => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const hashRows = await db
      .select({
        contentHash: files.contentHash,
        count: sql<number>`count(*)`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          isNotNull(files.contentHash),
        ),
      )
      .groupBy(files.contentHash)
      .having(sql`count(*) > 1`)

    if (hashRows.length === 0) return []

    const hashes = hashRows
      .map((row) => row.contentHash)
      .filter((hash): hash is string => Boolean(hash))

    const fileRows = await db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        folderId: files.folderId,
        createdAt: files.createdAt,
        contentHash: files.contentHash,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          isNotNull(files.contentHash),
        ),
      )
      .orderBy(desc(files.createdAt))

    const byHash = new Map<string, DuplicateGroup['files']>()
    for (const row of fileRows) {
      if (!row.contentHash || !hashes.includes(row.contentHash)) continue
      const list = byHash.get(row.contentHash) ?? []
      list.push({
        id: row.id,
        name: row.name,
        size: row.size,
        mimeType: row.mimeType,
        folderId: row.folderId,
        createdAt: row.createdAt,
      })
      byHash.set(row.contentHash, list)
    }

    return [...byHash.entries()]
      .map(([contentHash, groupFiles]) => ({
        contentHash,
        totalSize: groupFiles.reduce((sum, file) => sum + file.size, 0),
        files: groupFiles,
      }))
      .sort((a, b) => b.totalSize - a.totalSize)
  },
)
