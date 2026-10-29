import { randomBytes } from 'node:crypto'

/** URL-safe opaque token for public share links (never the UploadThing key). */
export function generateShareToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
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
