import { createServerFn } from '@tanstack/react-start'

import {
  onboardingPreferencesSchema,
  onboardingStepSchema,
} from '#/lib/validation'

export const getOnboardingState = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')
    const { eq } = await import('drizzle-orm')

    const session = await requireSession()
    const rows = await db
      .select({
        name: user.name,
        onboardedAt: user.onboardedAt,
        onboardingStep: user.onboardingStep,
        viewPreference: user.viewPreference,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const row = rows.at(0)
    if (!row) {
      throw new Error('User not found')
    }

    return row
  },
)

export const setOnboardingStep = createServerFn({ method: 'POST' })
  .validator(onboardingStepSchema)
  .handler(async ({ data: step }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')
    const { eq } = await import('drizzle-orm')

    const session = await requireSession()

    await db
      .update(user)
      .set({ onboardingStep: step })
      .where(eq(user.id, session.user.id))

    return { step }
  })

export const saveOnboardingPreferences = createServerFn({ method: 'POST' })
  .validator(onboardingPreferencesSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')
    const { eq } = await import('drizzle-orm')

    const session = await requireSession()

    await db
      .update(user)
      .set({
        name: data.name,
        viewPreference: data.viewPreference,
        onboardingStep: 3,
      })
      .where(eq(user.id, session.user.id))

    return data
  })

export const markOnboardingUploadDone = createServerFn({
  method: 'POST',
}).handler(async () => {
  const { requireSession } = await import('#/server/auth.server')
  const { db } = await import('#/db')
  const { user } = await import('#/db/schema')
  const { eq } = await import('drizzle-orm')

  const session = await requireSession()

  await db
    .update(user)
    .set({ onboardingStep: 4 })
    .where(eq(user.id, session.user.id))

  return { ok: true as const }
})

export const completeOnboarding = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')
    const { eq } = await import('drizzle-orm')

    const session = await requireSession()

    await db
      .update(user)
      .set({
        onboardedAt: new Date(),
        onboardingStep: 4,
      })
      .where(eq(user.id, session.user.id))

    return { ok: true as const }
  },
)

export const skipOnboarding = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { user } = await import('#/db/schema')
    const { eq } = await import('drizzle-orm')

    const session = await requireSession()

    await db
      .update(user)
      .set({
        onboardedAt: new Date(),
        onboardingStep: 4,
      })
      .where(eq(user.id, session.user.id))

    return { ok: true as const }
  },
)
