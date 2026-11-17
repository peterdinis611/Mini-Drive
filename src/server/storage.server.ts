import { and, eq, isNull, sql, sum } from 'drizzle-orm'

import { checkStorageQuota } from '#/lib/storage-quota'

/** Bytes used by active (non-trashed) files for a user. */
export async function getUsedStorageBytes(userId: string): Promise<number> {
  const { db } = await import('#/db')
  const { files } = await import('#/db/schema')

  const rows = await db
    .select({ total: sum(files.size) })
    .from(files)
    .where(and(eq(files.userId, userId), isNull(files.deletedAt)))

  return Number(rows.at(0)?.total ?? 0)
}

/**
 * Quota check under a transaction-scoped advisory lock so parallel uploads
 * cannot all pass a stale SUM.
 */
export async function assertStorageQuota(
  userId: string,
  additionalBytes: number,
  options?: { releasingBytes?: number },
): Promise<void> {
  const { pool } = await import('#/db')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [userId])

    const usedResult = await client.query<{ total: string | null }>(
      `SELECT COALESCE(SUM(size), 0)::text AS total
       FROM files
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    )
    const used = Number(usedResult.rows[0]?.total ?? 0)
    const result = checkStorageQuota({
      usedBytes: used,
      additionalBytes,
      releasingBytes: options?.releasingBytes,
    })
    if (!result.ok) {
      await client.query('ROLLBACK')
      throw new Error(result.message)
    }
    await client.query('COMMIT')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    throw error
  } finally {
    client.release()
  }
}

/** Version number for the next archive of a file (1-based). */
export async function nextFileVersionNumber(fileId: string): Promise<number> {
  const { db } = await import('#/db')
  const { fileVersions } = await import('#/db/schema')

  const rows = await db
    .select({
      maxVersion: sql<number>`coalesce(max(${fileVersions.version}), 0)`,
    })
    .from(fileVersions)
    .where(eq(fileVersions.fileId, fileId))

  return Number(rows.at(0)?.maxVersion ?? 0) + 1
}

/** Archive current blob into file_versions, then point `files` at the new UploadThing key. */
export async function archiveAndReplaceFile(args: {
  userId: string
  fileId: string
  uploadthingKey: string
  size: number
  mimeType: string
  name?: string
}) {
  const { db } = await import('#/db')
  const { files, fileVersions } = await import('#/db/schema')
  const { and, eq, isNull } = await import('drizzle-orm')
  const { firstOrThrow } = await import('#/server/db-helpers.server')

  const current = firstOrThrow(
    await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, args.fileId),
          eq(files.userId, args.userId),
          isNull(files.deletedAt),
        ),
      )
      .limit(1),
    'Súbor neexistuje',
  )

  await assertStorageQuota(args.userId, args.size, {
    releasingBytes: current.size,
  })

  const archiveVersion = await nextFileVersionNumber(args.fileId)

  await db.insert(fileVersions).values({
    fileId: args.fileId,
    version: archiveVersion,
    name: current.name,
    size: current.size,
    mimeType: current.mimeType,
    uploadthingKey: current.uploadthingKey,
  })

  const replaced = firstOrThrow(
    await db
      .update(files)
      .set({
        uploadthingKey: args.uploadthingKey,
        size: args.size,
        mimeType: args.mimeType,
        name: args.name ?? current.name,
        currentVersion: archiveVersion + 1,
      })
      .where(and(eq(files.id, args.fileId), eq(files.userId, args.userId)))
      .returning({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        folderId: files.folderId,
        createdAt: files.createdAt,
        currentVersion: files.currentVersion,
      }),
    'Nepodarilo sa nahradiť súbor',
  )

  const { revokeSharesForFileId } = await import('#/server/share-revoke.server')
  await revokeSharesForFileId(args.fileId)

  return replaced
}
