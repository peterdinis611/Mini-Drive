import { describe, expect, it } from 'vitest'

import { cn } from '#/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('resolves Tailwind conflicts with the last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', false && 'hidden', 'font-medium')).toBe(
      'text-red-500 font-medium',
    )
  })
})
