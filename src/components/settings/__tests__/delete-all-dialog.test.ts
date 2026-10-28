import { describe, expect, it } from 'vitest'

import { DELETE_ALL_CONFIRM_WORD } from '#/components/settings/delete-all-dialog'

describe('DELETE_ALL_CONFIRM_WORD', () => {
  it('matches case-insensitive Slovak typing', () => {
    expect('zmazať'.toLocaleUpperCase('sk-SK')).toBe(DELETE_ALL_CONFIRM_WORD)
    expect('ZMAZAŤ').toBe(DELETE_ALL_CONFIRM_WORD)
  })
})
