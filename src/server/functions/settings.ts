import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { updateSettingsSchema } from '#/lib/validation'

export const updateSettings = createServerFn({ method: 'POST' })
  .validator(updateSettingsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')

    const session = await requireSession()

    await db
      .update(user)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.viewPreference !== undefined
          ? { viewPreference: data.viewPreference }
          : {}),
        ...(data.themePreference !== undefined
          ? { themePreference: data.themePreference }
          : {}),
        ...(data.defaultShareExpiresIn !== undefined
          ? { defaultShareExpiresIn: data.defaultShareExpiresIn }
          : {}),
        ...(data.confirmDelete !== undefined
          ? { confirmDelete: data.confirmDelete }
          : {}),
        ...(data.customHotkeys !== undefined
          ? { customHotkeys: data.customHotkeys }
          : {}),
      })
      .where(eq(user.id, session.user.id))

    return { ok: true as const }
  })

export const getCustomHotkeys = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getSessionFromRequest } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')

    const session = await getSessionFromRequest()
    if (!session) return { customHotkeys: null as string | null }

    const row = await db
      .select({ customHotkeys: user.customHotkeys })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    return { customHotkeys: row.at(0)?.customHotkeys ?? null }
  },
)
