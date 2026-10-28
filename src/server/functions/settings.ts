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
      })
      .where(eq(user.id, session.user.id))

    return { ok: true as const }
  })
