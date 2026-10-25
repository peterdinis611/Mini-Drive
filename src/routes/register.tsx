import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { requireGuestSession } from '#/lib/route-guards'
import { authPageHead } from '#/lib/seo'
import { getAuthChromeRsc } from '#/server/rsc/public-pages'

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuestSession,
  loader: async () => getAuthChromeRsc({ data: { mode: 'register' } }),
  head: () => authPageHead('register'),
  component: RegisterPage,
})

function RegisterPage() {
  const { Renderable } = Route.useLoaderData()
  return <AuthForm mode="register" intro={Renderable} />
}
