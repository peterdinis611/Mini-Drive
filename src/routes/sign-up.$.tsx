import { createFileRoute } from '@tanstack/react-router'

import { AuthShell } from '#/components/auth/auth-shell'
import { ClerkSignUpForm } from '#/components/auth/clerk-auth-forms'
import { requireGuestSession } from '#/lib/route-guards'
import { authPageHead } from '#/lib/seo'

export const Route = createFileRoute('/sign-up/$')({
  beforeLoad: requireGuestSession,
  head: () => authPageHead('register'),
  component: Page,
})

function Page() {
  return (
    <AuthShell>
      <ClerkSignUpForm />
    </AuthShell>
  )
}
