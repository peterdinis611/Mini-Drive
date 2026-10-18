import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { AppError, formatZodError, getErrorMessage } from '#/lib/errors'

describe('getErrorMessage', () => {
  it('maps known auth and network errors', () => {
    expect(getErrorMessage(new Error('Unauthorized'))).toBe(
      'Musíš byť prihlásený',
    )
    expect(getErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Server neodpovedá. Skontroluj pripojenie.',
    )
  })

  it('keeps AppError messages', () => {
    expect(getErrorMessage(new AppError('Priečinok neexistuje'))).toBe(
      'Priečinok neexistuje',
    )
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
  })
})
