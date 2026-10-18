import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OnboardingWizard } from './onboarding-wizard'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({
    children,
    to,
    className,
  }: {
    children?: unknown
    to?: string
    className?: string
  }) => (
    <a href={to ?? '/'} className={className}>
      {children as never}
    </a>
  ),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', setTheme: vi.fn() }),
}))

vi.mock('#/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('#/server/functions/onboarding', () => ({
  setOnboardingStep: vi.fn(async () => ({ step: 2 })),
  saveOnboardingPreferences: vi.fn(async () => ({
    name: 'Peter',
    viewPreference: 'list',
  })),
  markOnboardingUploadDone: vi.fn(async () => ({ ok: true })),
  completeOnboarding: vi.fn(async () => ({ ok: true })),
  skipOnboarding: vi.fn(async () => ({ ok: true })),
}))

describe('OnboardingWizard', () => {
  beforeEach(() => {
    navigate.mockReset()
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('moves from welcome to preferences', async () => {
    const user = userEvent.setup()

    render(
      <OnboardingWizard
        initial={{
          name: 'Peter',
          onboardedAt: null,
          onboardingStep: 1,
          viewPreference: 'list',
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: /Mini Drive/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }))
    expect(
      await screen.findByText(/Profil a preferencie/i),
    ).toBeInTheDocument()
  })

  it('exposes skip action', async () => {
    const user = userEvent.setup()
    const { skipOnboarding } = await import('#/server/functions/onboarding')

    render(
      <OnboardingWizard
        initial={{
          name: 'Peter',
          onboardedAt: null,
          onboardingStep: 1,
          viewPreference: 'list',
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Preskočiť' }))
    expect(skipOnboarding).toHaveBeenCalled()
  })
})
