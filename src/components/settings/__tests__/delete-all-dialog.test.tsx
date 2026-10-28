import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DELETE_ALL_CONFIRM_WORD,
  DeleteAllDialog,
} from '#/components/settings/delete-all-dialog'
import { TRASH_RETENTION_DAYS } from '#/lib/constants'

afterEach(() => {
  cleanup()
})

describe('DELETE_ALL_CONFIRM_WORD', () => {
  it('matches case-insensitive Slovak typing', () => {
    expect('zmazať'.toLocaleUpperCase('sk-SK')).toBe(DELETE_ALL_CONFIRM_WORD)
    expect('ZMAZAŤ').toBe(DELETE_ALL_CONFIRM_WORD)
  })
})

describe('DeleteAllDialog', () => {
  it('blocks confirm when drive is empty', () => {
    render(
      <DeleteAllDialog
        open
        fileCount={0}
        folderCount={0}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/Úložisko je prázdne/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText(/Na potvrdenie napíš/i),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Presunúť všetko do koša/i }),
    ).toBeDisabled()
  })

  it('shows counts and retention window', () => {
    render(
      <DeleteAllDialog
        open
        fileCount={3}
        folderCount={2}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${TRASH_RETENTION_DAYS} dní`)),
    ).toBeInTheDocument()
  })

  it('enables confirm only after the exact word and calls onConfirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(async () => undefined)

    render(
      <DeleteAllDialog
        open
        fileCount={1}
        folderCount={0}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    const confirm = screen.getByRole('button', {
      name: /Presunúť všetko do koša/i,
    })
    expect(confirm).toBeDisabled()

    await user.type(
      screen.getByLabelText(/Na potvrdenie napíš/i),
      'zmazať',
    )
    expect(confirm).toBeEnabled()

    await user.click(confirm)
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  it('closes via Zrušiť', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <DeleteAllDialog
        open
        fileCount={1}
        folderCount={1}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Zrušiť' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
