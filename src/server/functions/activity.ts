import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const listActivity = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { activityEvents } = await import('#/db/schema')

    const session = await requireSession()

    return db
      .select({
        id: activityEvents.id,
        action: activityEvents.action,
        targetType: activityEvents.targetType,
        targetId: activityEvents.targetId,
        summary: activityEvents.summary,
        createdAt: activityEvents.createdAt,
      })
      .from(activityEvents)
      .where(eq(activityEvents.userId, session.user.id))
      .orderBy(desc(activityEvents.createdAt))
      .limit(80)
  },
)
