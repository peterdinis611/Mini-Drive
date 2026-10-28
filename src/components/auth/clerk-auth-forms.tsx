import { lazy, Suspense } from 'react'
import { useTheme } from 'next-themes'

import { AuthCardSkeleton } from '#/components/auth/auth-shell'
import {
  clerkAppearanceDark,
  clerkAppearanceLight,
} from '#/lib/clerk-appearance'

const SignIn = lazy(() =>
  import('@clerk/tanstack-react-start').then((m) => ({ default: m.SignIn })),
)
const SignUp = lazy(() =>
  import('@clerk/tanstack-react-start').then((m) => ({ default: m.SignUp })),
)

function useAuthAppearance() {
  const { resolvedTheme } = useTheme()
  // Prefer dark until theme resolves — matches auth backdrop.
  return resolvedTheme === 'light' ? clerkAppearanceLight : clerkAppearanceDark
}

export function ClerkSignInForm() {
  const appearance = useAuthAppearance()
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <SignIn
        appearance={appearance}
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </Suspense>
  )
}

export function ClerkSignUpForm() {
  const appearance = useAuthAppearance()
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <SignUp
        appearance={appearance}
        signInUrl="/sign-in"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </Suspense>
  )
}
