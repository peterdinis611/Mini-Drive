import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import { getFileKind } from '#/lib/file-kind'
import {
  createSmartFolderSchema,
  createTagSchema,
  deleteSmartFolderSchema,
  deleteTagSchema,
  setFileTagsSchema,
  setFolderTagsSchema,
  smartFolderRulesSchema,
} from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

export const listTags = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireSession } = await import('#/server/auth.server')
  const { db } = await import('#/db')
  const { tags } = await import('#/db/schema')

  const session = await requireSession()

  return db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt,
    })
    .from(tags)
    .where(eq(tags.userId, session.user.id))
    .orderBy(tags.name)
})

export const createTag = createServerFn({ method: 'POST' })
  .validator(createTagSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { tags } = await import('#/db/schema')

    const session = await requireSession()

    try {
      const created = firstOrThrow(
        await db
          .insert(tags)
          .values({
            userId: session.user.id,
            name: data.name,
            color: data.color ?? '#2f6fed',
          })
          .returning({
            id: tags.id,
            name: tags.name,
            color: tags.color,
          }),
        'Nepodarilo sa vytvoriť tag',
      )
      return created
    } catch {
      throw new Error('Tag s týmto názvom už existuje')
    }
  })

export const deleteTag = createServerFn({ method: 'POST' })
  .validator(deleteTagSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { tags } = await import('#/db/schema')

    const session = await requireSession()

    await db
      .delete(tags)
      .where(and(eq(tags.id, data.tagId), eq(tags.userId, session.user.id)))

    return { ok: true as const }
  })

export const setFileTags = createServerFn({ method: 'POST' })
  .validator(setFileTagsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, fileTags, tags } = await import('#/db/schema')

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
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    if (data.tagIds.length > 0) {
      const owned = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), inArray(tags.id, data.tagIds)))
      if (owned.length !== data.tagIds.length) {
        throw new Error('Neplatný tag')
      }
    }

    await db.delete(fileTags).where(eq(fileTags.fileId, data.fileId))
    if (data.tagIds.length > 0) {
      await db.insert(fileTags).values(
        data.tagIds.map((tagId) => ({
          fileId: data.fileId,
          tagId,
        })),
      )
    }

    return { ok: true as const }
  })

export const setFolderTags = createServerFn({ method: 'POST' })
  .validator(setFolderTagsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { folders, folderTags, tags } = await import('#/db/schema')

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

    if (data.tagIds.length > 0) {
      const owned = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), inArray(tags.id, data.tagIds)))
      if (owned.length !== data.tagIds.length) {
        throw new Error('Neplatný tag')
      }
    }

    await db.delete(folderTags).where(eq(folderTags.folderId, data.folderId))
    if (data.tagIds.length > 0) {
      await db.insert(folderTags).values(
        data.tagIds.map((tagId) => ({
          folderId: data.folderId,
          tagId,
        })),
      )
    }

    return { ok: true as const }
  })

export const listSmartFolders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { smartFolders } = await import('#/db/schema')

    const session = await requireSession()

    const rows = await db
      .select({
        id: smartFolders.id,
        name: smartFolders.name,
        rulesJson: smartFolders.rulesJson,
        createdAt: smartFolders.createdAt,
      })
      .from(smartFolders)
      .where(eq(smartFolders.userId, session.user.id))
      .orderBy(desc(smartFolders.createdAt))

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      rules: parseRules(row.rulesJson),
    }))
  },
)

export const createSmartFolder = createServerFn({ method: 'POST' })
  .validator(createSmartFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { smartFolders } = await import('#/db/schema')

    const session = await requireSession()

    const created = firstOrThrow(
      await db
        .insert(smartFolders)
        .values({
          userId: session.user.id,
          name: data.name,
          rulesJson: JSON.stringify(data.rules),
        })
        .returning({
          id: smartFolders.id,
          name: smartFolders.name,
          rulesJson: smartFolders.rulesJson,
        }),
      'Nepodarilo sa vytvoriť smart folder',
    )

    return {
      id: created.id,
      name: created.name,
      rules: parseRules(created.rulesJson),
    }
  })

export const deleteSmartFolder = createServerFn({ method: 'POST' })
  .validator(deleteSmartFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { smartFolders } = await import('#/db/schema')

    const session = await requireSession()

    await db
      .delete(smartFolders)
      .where(
        and(
          eq(smartFolders.id, data.smartFolderId),
          eq(smartFolders.userId, session.user.id),
        ),
      )

    return { ok: true as const }
  })

export const querySmartFolderFiles = createServerFn({ method: 'GET' })
  .validator(smartFolderRulesSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, fileTags } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    let rows = await db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        folderId: files.folderId,
        createdAt: files.createdAt,
        contentHash: files.contentHash,
        contentText: files.contentText,
      })
      .from(files)
      .where(and(eq(files.userId, userId), isNull(files.deletedAt)))
      .orderBy(desc(files.createdAt))
      .limit(500)

    if (data.kind && data.kind !== 'all') {
      rows = rows.filter((row) => {
        const fileKind = getFileKind(row.mimeType, row.name)
        if (data.kind === 'text') {
          return fileKind === 'text' || fileKind === 'code'
        }
        return fileKind === data.kind
      })
    }

    if (data.query?.trim()) {
      const q = data.query.trim().toLocaleLowerCase('sk-SK')
      rows = rows.filter(
        (row) =>
          row.name.toLocaleLowerCase('sk-SK').includes(q) ||
          (row.contentText ?? '').toLocaleLowerCase('sk-SK').includes(q),
      )
    }

    if (data.tagId) {
      const tagged = await db
        .select({ fileId: fileTags.fileId })
        .from(fileTags)
        .where(eq(fileTags.tagId, data.tagId))
      const allowed = new Set(tagged.map((row) => row.fileId))
      rows = rows.filter((row) => allowed.has(row.id))
    }

    if (data.duplicatesOnly) {
      const hashCounts = new Map<string, number>()
      for (const row of rows) {
        if (!row.contentHash) continue
        hashCounts.set(row.contentHash, (hashCounts.get(row.contentHash) ?? 0) + 1)
      }
      rows = rows.filter(
        (row) =>
          row.contentHash != null && (hashCounts.get(row.contentHash) ?? 0) > 1,
      )
    }

    return rows.map(({ contentHash: _h, contentText: _t, ...rest }) => rest)
  })

function parseRules(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = smartFolderRulesSchema.safeParse(parsed)
    return result.success ? result.data : {}
  } catch {
    return {}
  }
}
