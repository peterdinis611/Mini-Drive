import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  return <AuthForm mode="register" />
}
