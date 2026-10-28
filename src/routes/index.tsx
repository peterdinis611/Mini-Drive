import { createFileRoute, redirect } from '@tanstack/react-router'

import { buildSeoHead, landingPageJsonLd } from '#/lib/seo'
import { SITE } from '#/lib/site'
import { APP_NAME } from '#/lib/constants'
import { getLandingPageRsc } from '#/server/rsc/public-pages'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) return
    if (!session.user.onboardedAt) {
      throw redirect({ to: '/onboarding' })
    }
    throw redirect({ to: '/files' })
  },
  loader: async () => getLandingPageRsc(),
  head: () =>
    buildSeoHead({
      title: `${APP_NAME} — ${SITE.tagline}`,
      description: SITE.description,
      path: '/',
      brandSuffix: false,
      jsonLd: [landingPageJsonLd()],
    }),
  component: HomePage,
})

function HomePage() {
  const { Renderable } = Route.useLoaderData()
  return <>{Renderable}</>
}
