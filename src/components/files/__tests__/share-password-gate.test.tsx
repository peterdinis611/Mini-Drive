import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SharePasswordGate } from '../share-password-gate'

const unlockPublicShare = vi.fn()

vi.mock('#/server/functions/shares', () => ({
  unlockPublicShare: (...args: unknown[]) => unlockPublicShare(...args),
}))

describe('SharePasswordGate', () => {
  beforeEach(() => {
    unlockPublicShare.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('unlocks on correct password', async () => {
    const onUnlocked = vi.fn()
    unlockPublicShare.mockResolvedValue({
      status: 'ok',
      url: 'https://cdn.example/file',
      fileName: 'secret.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      signedUrlExpiresIn: 300,
    })

    const user = userEvent.setup()
    render(
      <SharePasswordGate token="tok_abcdefghijklmn" onUnlocked={onUnlocked} />,
    )

    await user.type(screen.getByLabelText(/heslo/i), 'spravne')
    await user.click(screen.getByRole('button', { name: /odomknúť|odoslať/i }))

    await waitFor(() => {
      expect(onUnlocked).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://cdn.example/file',
          fileName: 'secret.pdf',
        }),
      )
    })
  })

  it('shows error for invalid password', async () => {
    unlockPublicShare.mockResolvedValue({
      status: 'password_invalid',
      fileName: 'secret.pdf',
    })

    const user = userEvent.setup()
    render(
      <SharePasswordGate
        token="tok_abcdefghijklmn"
        fileName="secret.pdf"
        onUnlocked={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/heslo/i), 'zle')
    await user.click(screen.getByRole('button', { name: /odomknúť|odoslať/i }))

    expect(await screen.findByText(/Nesprávne heslo/i)).toBeInTheDocument()
  })

  it('surfaces rate-limit messaging', async () => {
    unlockPublicShare.mockResolvedValue({
      status: 'rate_limited',
      retryAfterMs: 15_000,
    })

    const user = userEvent.setup()
    render(
      <SharePasswordGate token="tok_abcdefghijklmn" onUnlocked={vi.fn()} />,
    )

    await user.type(screen.getByLabelText(/heslo/i), 'whatever')
    await user.click(screen.getByRole('button', { name: /odomknúť|odoslať/i }))

    expect(await screen.findByText(/Príliš veľa pokusov/i)).toBeInTheDocument()
  })

  it('shows gone messaging when the link is no longer valid', async () => {
    unlockPublicShare.mockResolvedValue({
      status: 'gone',
      reason: 'revoked',
      fileName: 'secret.pdf',
    })

    const user = userEvent.setup()
    render(
      <SharePasswordGate
        token="tok_abcdefghijklmn"
        fileName="secret.pdf"
        onUnlocked={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/heslo/i), 'whatever')
    await user.click(screen.getByRole('button', { name: /odomknúť|odoslať/i }))

    expect(
      await screen.findByText(/Odkaz už nie je platný/i),
    ).toBeInTheDocument()
  })

  it('keeps submit disabled until a password is entered', () => {
    render(
      <SharePasswordGate token="tok_abcdefghijklmn" onUnlocked={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /odomknúť/i })).toBeDisabled()
  })

  it('surfaces thrown unlock errors', async () => {
    unlockPublicShare.mockRejectedValue(new Error('sieť padla'))
    const user = userEvent.setup()
    render(
      <SharePasswordGate token="tok_abcdefghijklmn" onUnlocked={vi.fn()} />,
    )
    await user.type(screen.getByLabelText(/heslo/i), 'x')
    await user.click(screen.getByRole('button', { name: /odomknúť/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sieť padla/i)
  })
})
