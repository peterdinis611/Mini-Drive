import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Share-link password floor. */
export const SHARE_PASSWORD_MIN = 10
export const SHARE_PASSWORD_MAX = 128

const SALT_LEN = 16
const KEY_LEN = 32
/** N=2^17 — stronger offline resistance than v1 (2^14). */
const SCRYPT_N = 131_072
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_N_V1 = 16_384

/**
 * Pepper for share passwords. Prefer SHARE_PASSWORD_PEPPER; fall back to
 * AUDIT_IP_PEPPER so production still hardens when only one secret is set.
 */
export function resolveSharePasswordPepper(): string {
  const dedicated = process.env.SHARE_PASSWORD_PEPPER?.trim()
  if (dedicated) return dedicated
  const audit = process.env.AUDIT_IP_PEPPER?.trim()
  if (audit) return audit
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SHARE_PASSWORD_PEPPER or AUDIT_IP_PEPPER is required')
  }
  return 'dev-insecure-share-password-pepper'
}

function pepperPassword(password: string): string {
  return `${password}\0${resolveSharePasswordPepper()}`
}

/**
 * Encode: `v2$<salt_b64url>$<hash_b64url>` (peppered scrypt).
 * Legacy `v1$…` hashes remain verifiable without pepper.
 * Server-only — do not import from client components.
 */
export function hashSharePassword(password: string): string {
  const salt = randomBytes(SALT_LEN)
  const hash = scryptSync(pepperPassword(password), salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 256 * 1024 * 1024,
  })
  return `v2$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifySharePassword(
  password: string,
  encoded: string | null | undefined,
): boolean {
  if (!encoded) return false
  const parts = encoded.split('$')
  if (parts.length !== 3) return false
  const version = parts[0]
  const salt = Buffer.from(parts[1]!, 'base64url')
  const expected = Buffer.from(parts[2]!, 'base64url')
  if (salt.length !== SALT_LEN || expected.length !== KEY_LEN) return false

  let actual: Buffer
  if (version === 'v2') {
    actual = scryptSync(pepperPassword(password), salt, KEY_LEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 256 * 1024 * 1024,
    })
  } else if (version === 'v1') {
    actual = scryptSync(password, salt, KEY_LEN, {
      N: SCRYPT_N_V1,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 64 * 1024 * 1024,
    })
  } else {
    return false
  }

  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
