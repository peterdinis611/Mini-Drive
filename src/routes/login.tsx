import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { requireGuestSession } from '#/lib/route-guards'
import { buildSeoHead } from '#/lib/seo'

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuestSession,
  head: () =>
    buildSeoHead({
      title: 'Prihlásenie',
      description:
        'Prihlás sa do Mini Drive a spravuj svoje súbory, priečinky a safe-url zdieľania.',
      path: '/login',
    }),
  component: LoginPage,
})

function LoginPage() {
  return <AuthForm mode="login" />
}
