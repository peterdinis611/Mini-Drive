import { createHash, randomBytes } from 'node:crypto'

/** URL-safe opaque token for public share links (never the UploadThing key). */
export function generateShareToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}

/** SHA-256 hex — only this is stored in Postgres; plaintext lives in the URL. */
export function hashShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function buildSharePath(token: string): string {
  return `/s/${token}`
}

/** Embeddable preview surface (iframe-friendly). */
export function buildEmbedPath(token: string): string {
  return `/e/${token}`
}

export function resolveShareStatus(link: {
  expiresAt: Date | number
  revokedAt: Date | number | null
}): 'active' | 'expired' | 'revoked' {
  if (link.revokedAt != null) return 'revoked'
  const expiresAt =
    link.expiresAt instanceof Date ? link.expiresAt.getTime() : link.expiresAt
  if (expiresAt <= Date.now()) return 'expired'
  return 'active'
}
