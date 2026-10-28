import { describe, expect, it } from 'vitest'

import {
  hashSharePassword,
  verifySharePassword,
} from '#/lib/share-password'

describe('share-password', () => {
  it('hashes and verifies', () => {
    const encoded = hashSharePassword('tajne-heslo')
    expect(encoded.startsWith('v1$')).toBe(true)
    expect(verifySharePassword('tajne-heslo', encoded)).toBe(true)
    expect(verifySharePassword('ine-heslo', encoded)).toBe(false)
  })

  it('rejects malformed hashes', () => {
    expect(verifySharePassword('x', null)).toBe(false)
    expect(verifySharePassword('x', 'bad')).toBe(false)
    expect(verifySharePassword('x', 'v2$a$b')).toBe(false)
  })
})
