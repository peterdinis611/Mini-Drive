import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return <AuthForm mode="login" />
}
