import { redirect } from '@tanstack/react-router'

import { getSession } from '#/server/session'

/** Shared beforeLoad guard for authenticated app routes. */
export async function requireOnboardedSession() {
  const session = await getSession()
  if (!session) {
    throw redirect({ href: '/sign-in' })
  }
  if (!session.user.onboardedAt) {
    throw redirect({ to: '/onboarding' })
  }
  return session
}

/** Shared beforeLoad guard for guest-only auth pages. */
export async function requireGuestSession() {
  // Cheap Clerk check first — skip DB user sync when already anonymous.
  const { auth } = await import('@clerk/tanstack-react-start/server')
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return

  const session = await getSession()
  if (session) {
    throw redirect({ to: '/' })
  }
}
