import { and, eq, isNull, sql, sum } from 'drizzle-orm'

import { STORAGE_QUOTA_BYTES } from '#/lib/constants'

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

export async function assertStorageQuota(
  userId: string,
  additionalBytes: number,
  options?: { releasingBytes?: number },
): Promise<void> {
  const used = await getUsedStorageBytes(userId)
  const releasing = options?.releasingBytes ?? 0
  const projected = used - releasing + additionalBytes

  if (projected > STORAGE_QUOTA_BYTES) {
    const remaining = Math.max(0, STORAGE_QUOTA_BYTES - (used - releasing))
    throw new Error(
      `Nedostatok miesta v úložisku (zostáva ${formatBytes(remaining)}).`,
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
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

  return firstOrThrow(
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
}
