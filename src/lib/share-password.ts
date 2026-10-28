import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Share-link password floor — lighter than account passwords. */
export const SHARE_PASSWORD_MIN = 6
export const SHARE_PASSWORD_MAX = 128

const SALT_LEN = 16
const KEY_LEN = 32
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

/**
 * Encode: `v1$<salt_b64url>$<hash_b64url>`
 * Server-only — do not import from client components.
 */
export function hashSharePassword(password: string): string {
  const salt = randomBytes(SALT_LEN)
  const hash = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  })
  return `v1$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifySharePassword(
  password: string,
  encoded: string | null | undefined,
): boolean {
  if (!encoded) return false
  const parts = encoded.split('$')
  if (parts.length !== 3 || parts[0] !== 'v1') return false
  const salt = Buffer.from(parts[1]!, 'base64url')
  const expected = Buffer.from(parts[2]!, 'base64url')
  if (salt.length !== SALT_LEN || expected.length !== KEY_LEN) return false

  const actual = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  })

  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
