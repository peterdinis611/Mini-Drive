import { ClerkProvider } from '@clerk/tanstack-react-start'
import { useTheme } from 'next-themes'

import {
  clerkAppearanceDark,
  clerkAppearanceLight,
} from '#/lib/clerk-appearance'

export function ThemedClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const appearance =
    resolvedTheme === 'light' ? clerkAppearanceLight : clerkAppearanceDark

  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      telemetry={false}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  )
}
