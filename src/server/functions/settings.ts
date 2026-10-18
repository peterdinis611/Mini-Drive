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
        ...(data.name ? { name: data.name } : {}),
        ...(data.viewPreference
          ? { viewPreference: data.viewPreference }
          : {}),
      })
      .where(eq(user.id, session.user.id))

    return { ok: true as const }
  })
