import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'

import {
  createSavedSearchSchema,
  deleteSavedSearchSchema,
} from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

export const listSavedSearches = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { savedSearches } = await import('#/db/schema')

    const session = await requireSession()

    return db
      .select({
        id: savedSearches.id,
        name: savedSearches.name,
        query: savedSearches.query, 
        kind: savedSearches.kind,
        createdAt: savedSearches.createdAt,
      })
      .from(savedSearches)
      .where(eq(savedSearches.userId, session.user.id))
      .orderBy(desc(savedSearches.createdAt))
  },
)

export const createSavedSearch = createServerFn({ method: 'POST' })
  .validator(createSavedSearchSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { savedSearches } = await import('#/db/schema')

    const session = await requireSession()

    return firstOrThrow(
      await db
        .insert(savedSearches)
        .values({
          userId: session.user.id,
          name: data.name,
          query: data.query,
          kind: data.kind ?? null,
        })
        .returning({
          id: savedSearches.id,
          name: savedSearches.name,
          query: savedSearches.query,
          kind: savedSearches.kind,
        }),
      'Nepodarilo sa uložiť hľadanie',
    )
  })

export const deleteSavedSearch = createServerFn({ method: 'POST' })
  .validator(deleteSavedSearchSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { savedSearches } = await import('#/db/schema')

    const session = await requireSession()

    await db
      .delete(savedSearches)
      .where(
        and(
          eq(savedSearches.id, data.searchId),
          eq(savedSearches.userId, session.user.id),
        ),
      )

    return { ok: true as const }
  })
