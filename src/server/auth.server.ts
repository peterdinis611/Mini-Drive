import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { eq } from 'drizzle-orm'

import { db, pool } from '#/db'
import { rekeyUserId } from '#/db/rekey-user'
import { user } from '#/db/schema'

export type AppUser = typeof user.$inferSelect

export type AppSession = {
  user: AppUser
  session: {
    id: string
    userId: string
  }
}

function displayName(parts: {
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
}) {
  const full = [parts.firstName, parts.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  if (full) return full
  if (parts.username?.trim()) return parts.username.trim()
  return parts.email.split('@')[0] || 'User'
}

async function findUserById(id: string): Promise<AppUser | undefined> {
  return db
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
    .then((rows) => rows[0])
}

async function findUserByEmail(email: string): Promise<AppUser | undefined> {
  return db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
    .then((rows) => rows[0])
}

/** Ensure a local Postgres user row exists for the Clerk user (app prefs / ownership). */
async function ensureLocalUser(clerkUserId: string): Promise<AppUser> {
  const existing = await findUserById(clerkUserId)
  if (existing) return existing

  const clerkUser = await clerkClient().users.getUser(clerkUserId)
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@users.clerk`

  const emailVerified = clerkUser.emailAddresses.some(
    (entry) =>
      entry.emailAddress === primaryEmail &&
      entry.verification?.status === 'verified',
  )

  const name = displayName({
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    username: clerkUser.username,
    email: primaryEmail,
  })
  const image = clerkUser.imageUrl ?? null

  // Legacy better-auth row with same email but different id → re-key to Clerk.
  const byEmail = await findUserByEmail(primaryEmail)
  if (byEmail && byEmail.id !== clerkUserId) {
    await rekeyUserId(pool, byEmail.id, clerkUserId)
    await db
      .update(user)
      .set({
        name,
        emailVerified,
        image,
        updatedAt: new Date(),
      })
      .where(eq(user.id, clerkUserId))

    const linked = await findUserById(clerkUserId)
    if (linked) return linked
  }

  try {
    await db.insert(user).values({
      id: clerkUserId,
      name,
      email: primaryEmail,
      emailVerified,
      image,
    })
  } catch {
    const raced =
      (await findUserById(clerkUserId)) ?? (await findUserByEmail(primaryEmail))
    if (raced) {
      if (raced.id !== clerkUserId) {
        await rekeyUserId(pool, raced.id, clerkUserId)
        const linked = await findUserById(clerkUserId)
        if (linked) return linked
      }
      return raced
    }
    throw new Error('Nepodarilo sa vytvoriť lokálneho používateľa')
  }

  const created = await findUserById(clerkUserId)
  if (!created) {
    throw new Error('Nepodarilo sa vytvoriť lokálneho používateľa')
  }

  return created
}

export async function getSessionFromRequest(): Promise<AppSession | null> {
  const { isAuthenticated, userId, sessionId } = await auth()
  if (!isAuthenticated || !userId) return null

  const localUser = await ensureLocalUser(userId)

  return {
    user: localUser,
    session: {
      id: sessionId ?? userId,
      userId,
    },
  }
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSessionFromRequest()

  if (!session) {
    throw new Error('Musíš byť prihlásený')
  }

  return session
}
