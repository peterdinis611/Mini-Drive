import { describe, expect, it } from 'vitest'

import { hashSharePassword, verifySharePassword } from '#/lib/share-password'

describe('share-password', () => {
  it('hashes and verifies with v2 peppered scrypt', () => {
    const encoded = hashSharePassword('tajne-heslo-dlhe')
    expect(encoded.startsWith('v2$')).toBe(true)
    expect(verifySharePassword('tajne-heslo-dlhe', encoded)).toBe(true)
    expect(verifySharePassword('ine-heslo-dlhe', encoded)).toBe(false)
  })

  it('rejects malformed hashes', () => {
    expect(verifySharePassword('x', null)).toBe(false)
    expect(verifySharePassword('x', 'bad')).toBe(false)
    expect(verifySharePassword('x', 'v3$a$b')).toBe(false)
  })
})
