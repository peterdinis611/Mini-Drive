import { createFileRoute } from '@tanstack/react-router'

import { AuthForm } from '#/components/auth/auth-form'
import { requireGuestSession } from '#/lib/route-guards'
import { buildSeoHead } from '#/lib/seo'

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuestSession,
  head: () =>
    buildSeoHead({
      title: 'Registrácia',
      description:
        'Vytvor si účet v Mini Drive — súkromné úložisko súborov so safe-url zdieľaním.',
      path: '/register',
    }),
  component: RegisterPage,
})

function RegisterPage() {
  return <AuthForm mode="register" />
}
