import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { requireGuestSession } from '#/lib/route-guards'
import { authPageHead } from '#/lib/seo'
import { getAuthChromeRsc } from '#/server/rsc/public-pages'

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuestSession,
  loader: async () => getAuthChromeRsc({ data: { mode: 'login' } }),
  head: () => authPageHead('login'),
  component: LoginPage,
})

function LoginPage() {
  const { Renderable } = Route.useLoaderData()
  return <AuthForm mode="login" intro={Renderable} />
}
