import { createServerFn } from '@tanstack/react-start'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getSessionFromRequest } = await import('#/server/auth.server')
    return getSessionFromRequest()
  },
)

export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    return requireSession()
  },
)
