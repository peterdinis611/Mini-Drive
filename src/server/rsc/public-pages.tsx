import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'

import { LandingPage } from '#/components/marketing/landing-page'

/** Server Component payload for the public landing page. */
export const getLandingPageRsc = createServerFn({ method: 'GET' }).handler(
  async () => {
    const Renderable = await renderServerComponent(<LandingPage />)
    return { Renderable }
  },
)
