import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const redirect = vi.fn((opts: unknown) => {
  const error = new Error('REDIRECT') as Error & { redirect: unknown }
  error.redirect = opts
  throw error
})

vi.mock('#/server/session', () => ({
  getSession: (...args: unknown[]) => getSession(...args),
}))

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: unknown) => redirect(opts),
}))

describe('route guards', () => {
  beforeEach(() => {
    getSession.mockReset()
    redirect.mockClear()
    vi.resetModules()
  })

  it('requireOnboardedSession redirects guests to sign-in', async () => {
    getSession.mockResolvedValue(null)
    const { requireOnboardedSession } = await import('#/lib/route-guards')
    await expect(requireOnboardedSession()).rejects.toThrow('REDIRECT')
    expect(redirect).toHaveBeenCalledWith({ href: '/sign-in' })
  })

  it('requireOnboardedSession sends incomplete profiles to onboarding', async () => {
    getSession.mockResolvedValue({
      user: { id: 'u1', onboardedAt: null },
    })
    const { requireOnboardedSession } = await import('#/lib/route-guards')
    await expect(requireOnboardedSession()).rejects.toThrow('REDIRECT')
    expect(redirect).toHaveBeenCalledWith({ to: '/onboarding' })
  })

  it('requireOnboardedSession returns session when onboarded', async () => {
    const session = { user: { id: 'u1', onboardedAt: new Date() } }
    getSession.mockResolvedValue(session)
    const { requireOnboardedSession } = await import('#/lib/route-guards')
    await expect(requireOnboardedSession()).resolves.toBe(session)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('requireGuestSession redirects signed-in users home', async () => {
    getSession.mockResolvedValue({ user: { id: 'u1' } })
    const { requireGuestSession } = await import('#/lib/route-guards')
    await expect(requireGuestSession()).rejects.toThrow('REDIRECT')
    expect(redirect).toHaveBeenCalledWith({ to: '/' })
  })

  it('requireGuestSession allows anonymous visitors', async () => {
    getSession.mockResolvedValue(null)
    const { requireGuestSession } = await import('#/lib/route-guards')
    await expect(requireGuestSession()).resolves.toBeUndefined()
    expect(redirect).not.toHaveBeenCalled()
  })
})
