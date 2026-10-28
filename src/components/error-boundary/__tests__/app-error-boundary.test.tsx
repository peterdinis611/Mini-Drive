import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { SectionErrorFallback } from '#/components/error-boundary/section-error-fallback'

function Boom({ message = 'Sekcia padla' }: { message?: string }): never {
  throw new Error(message)
}

afterEach(() => {
  cleanup()
})

describe('SectionErrorFallback', () => {
  it('renders title, message and resets on click', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()

    render(
      <SectionErrorFallback
        error={new Error('Preview zlyhalo')}
        resetErrorBoundary={reset}
        title="Náhľad spadol"
      />,
    )

    expect(
      screen.getByRole('alert'),
    ).toBeInTheDocument()
    expect(screen.getByText('Náhľad spadol')).toBeInTheDocument()
    expect(screen.getByText('Preview zlyhalo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Skúsiť znova/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('catches render errors and shows section fallback', () => {
    render(
      <AppErrorBoundary name="test-section" sectionTitle="Panel zlyhal">
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByText('Panel zlyhal')).toBeInTheDocument()
    expect(screen.getByText('Sekcia padla')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Skúsiť znova/i }),
    ).toBeInTheDocument()
  })

  it('recovers when resetKeys change after an error', () => {
    const { rerender } = render(
      <AppErrorBoundary resetKeys={[0]}>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(
      <AppErrorBoundary resetKeys={[1]}>
        <p>Obnovené</p>
      </AppErrorBoundary>,
    )

    expect(screen.getByText('Obnovené')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders children when healthy', () => {
    render(
      <AppErrorBoundary>
        <p>Všetko v poriadku</p>
      </AppErrorBoundary>,
    )
    expect(screen.getByText('Všetko v poriadku')).toBeInTheDocument()
  })
})
