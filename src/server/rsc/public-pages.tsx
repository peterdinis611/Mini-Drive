import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { z } from 'zod'

import { AuthPageChrome } from '#/components/marketing/auth-page-chrome'
import { LandingPage } from '#/components/marketing/landing-page'

/** Server Component payload for the public landing page. */
export const getLandingPageRsc = createServerFn({ method: 'GET' }).handler(
  async () => {
    const Renderable = await renderServerComponent(<LandingPage />)
    return { Renderable }
  },
)

const authChromeSchema = z.object({
  mode: z.enum(['login', 'register']),
})

/** Server Component payload for auth page chrome (login / register). */
export const getAuthChromeRsc = createServerFn({ method: 'GET' })
  .validator(authChromeSchema)
  .handler(async ({ data }) => {
    const Renderable = await renderServerComponent(
      <AuthPageChrome mode={data.mode} />,
    )
    return { Renderable }
  })
