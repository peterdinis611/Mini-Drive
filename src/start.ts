import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

import { buildContentSecurityPolicy } from '#/lib/csp'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
  ...(process.env.APP_URL
    ? { origin: process.env.APP_URL.replace(/\/$/, '') }
    : {}),
})

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next }) => {
    const result = await next()

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

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
    securityHeadersMiddleware,
    clerkMiddleware(),
  ],
}))
