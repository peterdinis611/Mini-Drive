import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BrandMark } from '#/components/brand-mark'
import { APP_NAME } from '#/lib/constants'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
    onClick,
  }: {
    children?: unknown
    to?: string
    className?: string
    onClick?: () => void
  }) => (
    <a href={to ?? '/'} className={className} onClick={onClick}>
      {children as never}
    </a>
  ),
}))

afterEach(() => {
  cleanup()
})

describe('BrandMark', () => {
  it('links home by default and shows the product name', () => {
    render(<BrandMark />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveTextContent(APP_NAME)
    expect(link).toHaveTextContent('M')
  })

  it('can target /files and fire onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<BrandMark to="/files" onClick={onClick} compact />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/files')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
