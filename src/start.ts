import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

import { silenceClerkDevKeySpam } from '#/lib/clerk-dev-silence'
import { buildContentSecurityPolicy } from '#/lib/csp'
import { assertProductionEnv, warnOptionalProductionEnv } from '#/lib/env'
import { cacheControlForPath } from '#/lib/http-cache'

silenceClerkDevKeySpam()
assertProductionEnv()
warnOptionalProductionEnv()

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
  ...(process.env.APP_URL
    ? { origin: process.env.APP_URL.replace(/\/$/, '') }
    : {}),
})

const securityHeadersMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const result = await next()
    const pathname = new URL(request.url).pathname

    setResponseHeader('X-Content-Type-Options', 'nosniff')
    setResponseHeader('X-Frame-Options', 'DENY')
    setResponseHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    setResponseHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    )
    setResponseHeader('X-DNS-Prefetch-Control', 'on')
    setResponseHeader(
      'Content-Security-Policy',
      buildContentSecurityPolicy(
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
      ),
    )

    const cacheControl = cacheControlForPath(pathname)
    if (cacheControl) {
      setResponseHeader('Cache-Control', cacheControl)
    }

    if (process.env.NODE_ENV === 'production') {
      setResponseHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      )
      setResponseHeader('Cross-Origin-Opener-Policy', 'same-origin')
      setResponseHeader('Cross-Origin-Resource-Policy', 'same-site')
    }

    return result
  },
)

const clerk = clerkMiddleware()

/** Skip Clerk on liveness probes so orchestrators don't need auth secrets. */
const clerkUnlessHealth = createMiddleware().server(async (ctx) => {
  const path = new URL(ctx.request.url).pathname
  if (path === '/api/health') {
    return ctx.next()
  }
  return clerk.options.server!(ctx)
})

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
    securityHeadersMiddleware,
    clerkUnlessHealth,
  ],
}))
