import { activityEvents } from '#/db/schema'

type ActivityArgs = {
  userId: string
  action: string
  targetType: 'file' | 'folder' | 'share' | 'system'
  targetId?: string | null
  summary: string
  meta?: Record<string, unknown>
}

/** Best-effort audit insert — never throws to callers. */
export async function recordActivity(args: ActivityArgs) {
  try {
    const { db } = await import('#/db')
    await db.insert(activityEvents).values({
      userId: args.userId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId ?? null,
      summary: args.summary,
      metaJson: args.meta ? JSON.stringify(args.meta) : null,
    })
  } catch {
    // ignore
  }
}
