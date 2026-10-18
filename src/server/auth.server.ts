import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

export async function getSessionFromRequest() {
  return auth.api.getSession({
    headers: getRequestHeaders(),
  })
}

export async function requireSession() {
  const session = await getSessionFromRequest()

  if (!session) {
    throw new Error('Musíš byť prihlásený')
  }

  return session
}
