import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull } from 'drizzle-orm'

import {
  addFileCommentSchema,
  deleteFileCommentSchema,
  listFileCommentsSchema,
  updateFileNoteSchema,
} from '#/lib/validation'
import { recordActivity } from '#/server/activity.server'
import { firstOrThrow } from '#/server/db-helpers.server'

export const updateFileNote = createServerFn({ method: 'POST' })
  .validator(updateFileNoteSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const existing = firstOrThrow(
      await db
        .select({ id: files.id, name: files.name })
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

    await db
      .update(files)
      .set({ note: data.note })
      .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))

    await recordActivity({
      userId,
      action: 'file.note',
      targetType: 'file',
      targetId: data.fileId,
      summary: `Poznámka pri „${existing.name}“`,
    })

    return { ok: true as const }
  })

export const getFileNote = createServerFn({ method: 'GET' })
  .validator(listFileCommentsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')

    const session = await requireSession()

    const row = firstOrThrow(
      await db
        .select({ note: files.note })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, session.user.id),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    return { note: row.note }
  })

export const listFileComments = createServerFn({ method: 'GET' })
  .validator(listFileCommentsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { fileComments, files, user } = await import('#/db/schema')

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

    return db
      .select({
        id: fileComments.id,
        body: fileComments.body,
        createdAt: fileComments.createdAt,
        authorName: user.name,
      })
      .from(fileComments)
      .innerJoin(user, eq(user.id, fileComments.userId))
      .where(eq(fileComments.fileId, data.fileId))
      .orderBy(desc(fileComments.createdAt))
  })

export const addFileComment = createServerFn({ method: 'POST' })
  .validator(addFileCommentSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { fileComments, files } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const file = firstOrThrow(
      await db
        .select({ id: files.id, name: files.name })
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

    const created = firstOrThrow(
      await db
        .insert(fileComments)
        .values({
          fileId: data.fileId,
          userId,
          body: data.body,
        })
        .returning({
          id: fileComments.id,
          body: fileComments.body,
          createdAt: fileComments.createdAt,
        }),
      'Nepodarilo sa pridať komentár',
    )

    await recordActivity({
      userId,
      action: 'file.comment',
      targetType: 'file',
      targetId: data.fileId,
      summary: `Komentár pri „${file.name}“`,
    })

    return created
  })

export const deleteFileComment = createServerFn({ method: 'POST' })
  .validator(deleteFileCommentSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { fileComments } = await import('#/db/schema')

    const session = await requireSession()

    await db
      .delete(fileComments)
      .where(
        and(
          eq(fileComments.id, data.commentId),
          eq(fileComments.userId, session.user.id),
        ),
      )

    return { ok: true as const }
  })
