import { createFileRoute } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { ClerkSignInForm } from '#/components/auth/clerk-auth-forms'
import { requireGuestSession } from '#/lib/route-guards'
import { authPageHead } from '#/lib/seo'

export const Route = createFileRoute('/sign-in/$')({
  beforeLoad: requireGuestSession,
  head: () => authPageHead('login'),
  component: Page,
})

function Page() {
  return (
    <AuthShell>
      <ClerkSignInForm />
    </AuthShell>
  )
}
