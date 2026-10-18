import { createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/server/session'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    if (!session.user.onboardedAt) {
      throw redirect({ to: '/onboarding' })
    }
    throw redirect({ to: '/files' })
  },
})
