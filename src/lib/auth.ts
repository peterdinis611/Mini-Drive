import type { user } from '#/db/schema'

/** Local app user row (synced from Clerk on first request). */
export type AuthUser = typeof user.$inferSelect

export type Session = {
  user: AuthUser
  session: {
    id: string
    userId: string
  }
}
