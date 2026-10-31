import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NotFoundPage, ServerErrorPage } from '../status-page'

vi.mock('motion/react', () => {
  const Motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({
          children,
          ...props
        }: {
          children?: React.ReactNode
          [key: string]: unknown
        }) => {
          const {
            initial: _i,
            animate: _a,
            transition: _t,
            whileHover: _h,
            whileTap: _p,
            ...rest
          } = props
          const Element = (tag === 'header' ? 'header' : 'div') as 'div'
          if (tag === 'header') {
            return <header {...rest}>{children}</header>
          }
          if (tag === 'p') return <p {...rest}>{children}</p>
          if (tag === 'span') return <span {...rest}>{children}</span>
          return <Element {...rest}>{children}</Element>
        },
    },
  )
  return {
    motion: Motion,
    useReducedMotion: () => true,
  }
})

vi.mock('#/components/brand-mark', () => ({
  BrandMark: () => <div data-testid="brand-mark">Mini Drive</div>,
}))

vi.mock('#/components/layout/atmosphere-backdrop', () => ({
  AtmosphereBackdrop: () => <div data-testid="atmosphere" />,
}))

vi.mock('#/components/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">theme</button>,
}))

vi.mock('#/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    asChild,
    ...props
  }: {
    children?: React.ReactNode
    onClick?: () => void
    asChild?: boolean
  }) => {
    if (asChild) return <>{children}</>
    return (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    )
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children?: React.ReactNode
    to?: string
  }) => (
    <a href={to ?? '/'} {...props}>
      {children}
    </a>
  ),
}))

describe('status pages', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders 404 not-found copy', () => {
    render(<NotFoundPage />)
    expect(screen.getByText(/Táto cesta v archíve nie je/i)).toBeInTheDocument()
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Domov/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('renders 500 with reset action', async () => {
    const reset = vi.fn()
    const user = userEvent.setup()
    render(<ServerErrorPage error={new Error('boom-detail')} reset={reset} />)
    expect(
      screen.getByText(/Úložisko momentálne neodpovedá/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Skúsiť znova/i }))
    expect(reset).toHaveBeenCalled()
  })
})
