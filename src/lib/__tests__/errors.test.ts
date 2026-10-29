import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  AppError,
  firstZodFieldErrors,
  formatZodError,
  getErrorMessage,
  reportError,
  toError,
} from '#/lib/errors'

describe('getErrorMessage', () => {
  it('maps known auth and network errors', () => {
    expect(getErrorMessage(new Error('Unauthorized'))).toBe(
      'Musíš byť prihlásený',
    )
    expect(getErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Server neodpovedá. Skontroluj pripojenie.',
    )
    expect(getErrorMessage(new Error('connection timeout'))).toBe(
      'Požiadavka vypršala. Skús to znova.',
    )
  })

  it('maps UploadThing nested data.error', () => {
    const error = new Error('wrapper') as Error & {
      data: { error: string }
    }
    error.data = { error: 'UPLOADTHING_TOKEN missing' }
    expect(getErrorMessage(error)).toBe(
      'Úložisko nie je nakonfigurované (chýba token).',
    )
  })

  it('maps string and message-shaped objects', () => {
    expect(getErrorMessage('Unauthorized')).toBe('Musíš byť prihlásený')
    expect(getErrorMessage({ message: 'Failed to fetch' })).toBe(
      'Server neodpovedá. Skontroluj pripojenie.',
    )
  })

  it('keeps AppError messages', () => {
    expect(getErrorMessage(new AppError('Priečinok neexistuje'))).toBe(
      'Priečinok neexistuje',
    )
    expect(new AppError('x', 'NOT_FOUND').code).toBe('NOT_FOUND')
  })

  it('formats zod errors', () => {
    const result = z.string().min(1, 'Povinné').safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(formatZodError(result.error)).toBe('Povinné')
      expect(getErrorMessage(result.error)).toBe('Povinné')
    }
  })

  it('falls back for unknown values', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
    expect(getErrorMessage(new Error('   '))).toBe('Niečo sa pokazilo')
  })

  it('maps chunk load failures', () => {
    expect(
      getErrorMessage(new Error('ChunkLoadError: Loading chunk 3 failed')),
    ).toBe('Nepodarilo sa načítať časť aplikácie. Obnov stránku.')
  })
})

describe('toError', () => {
  it('normalizes strings and message objects', () => {
    expect(toError(new Error('x'))).toBeInstanceOf(Error)
    expect(toError('boom').message).toBe('boom')
    expect(toError({ message: 'obj' }).message).toBe('obj')
    expect(toError(null, 'fallback').message).toBe('fallback')
  })
})

describe('firstZodFieldErrors', () => {
  it('maps the first issue per field', () => {
    const schema = z.object({
      email: z.string().email('Neplatný e-mail'),
      password: z.string().min(12, 'Príliš krátke'),
    })
    const result = schema.safeParse({ email: 'x', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstZodFieldErrors(result.error)).toEqual({
        email: 'Neplatný e-mail',
        password: 'Príliš krátke',
      })
    }
  })
})

describe('reportError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs in DEV with optional context and stack', () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    reportError(new Error('x'), 'preview', { componentStack: 'at Foo' })
    expect(errorSpy).toHaveBeenCalled()
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain('preview')
    expect(errorSpy).toHaveBeenCalledWith('at Foo')
  })
})
