import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { APP_NAME } from '#/lib/constants'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    hash,
    className,
    ...rest
  }: {
    children?: unknown
    to?: string
    hash?: string
    className?: string
    [key: string]: unknown
  }) => {
    const href = hash
      ? `${to ?? '/'}${hash.startsWith('#') ? hash : `#${hash}`}`
      : (to ?? '/')
    return (
      <a href={href} className={className} {...rest}>
        {children as never}
      </a>
    )
  },
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}))

vi.mock('#/components/marketing/fragments/landing-collage', () => ({
  LandingCollage: () => <div data-testid="landing-collage" />,
}))

import { LandingPage } from '#/components/marketing/landing-page'

afterEach(() => {
  cleanup()
})

describe('LandingPage', () => {
  it('renders brand, hero and section landmarks', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('link', { name: `${APP_NAME} — domov` }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.getByRole('heading', { name: /Súbory jednoducho/i, level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(
      screen.getByRole('navigation', { name: 'Sekcie stránky' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('landing-collage')).toBeInTheDocument()
  })

  it('points CTAs at Clerk sign-up with prefetch-ready Links', () => {
    render(<LandingPage />)

    const signUpLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/sign-up/$')

    expect(signUpLinks.length).toBeGreaterThanOrEqual(3)
    expect(
      screen.getByRole('link', { name: /Začať nahrávať zadarmo/i }),
    ).toHaveAttribute('href', '/sign-up/$')
    expect(
      screen.getByRole('link', { name: 'Prihlásenie' }),
    ).toHaveAttribute('href', '/sign-in/$')
  })

  it('exposes in-page section anchors', () => {
    render(<LandingPage />)

    expect(screen.getByRole('link', { name: 'Archív' })).toHaveAttribute(
      'href',
      '/#archiv',
    )
    expect(screen.getByRole('link', { name: 'Súkromie' })).toHaveAttribute(
      'href',
      '/#sukromie',
    )
  })
})
