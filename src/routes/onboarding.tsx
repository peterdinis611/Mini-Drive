import { createFileRoute, redirect } from '@tanstack/react-router'

import { OnboardingWizard } from '#/components/onboarding/onboarding-wizard'
import { privateAppHead } from '#/lib/seo'
import { getOnboardingState } from '#/server/functions/onboarding'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ href: '/sign-in' })
    }
    if (session.user.onboardedAt) {
      throw redirect({ to: '/files' })
    }
    return { session }
  },
  loader: async () => getOnboardingState(),
  head: () => privateAppHead('Onboarding', '/onboarding'),
  component: OnboardingPage,
})

function OnboardingPage() {
  const data = Route.useLoaderData()
  return (
    <OnboardingWizard
      initial={{
        name: data.name,
        onboardedAt: data.onboardedAt,
        onboardingStep: data.onboardingStep,
        viewPreference: data.viewPreference === 'grid' ? 'grid' : 'list',
      }}
    />
  )
}
