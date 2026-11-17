import { and, inArray, isNull } from 'drizzle-orm'

/** Soft-delete / blob replace must kill active public links. */
export async function revokeSharesForFileIds(
  fileIds: string[],
  now = new Date(),
): Promise<number> {
  if (fileIds.length === 0) return 0

  const { db } = await import('#/db')
  const { shareLinks } = await import('#/db/schema')

  const rows = await db
    .update(shareLinks)
    .set({ revokedAt: now })
    .where(
      and(inArray(shareLinks.fileId, fileIds), isNull(shareLinks.revokedAt)),
    )
    .returning({ id: shareLinks.id })

  return rows.length
}

export async function revokeSharesForFileId(fileId: string): Promise<number> {
  return revokeSharesForFileIds([fileId])
}
