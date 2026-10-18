import { createServerFn } from '@tanstack/react-start'
import {
  getRequestIP,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'
import { and, desc, eq, isNull } from 'drizzle-orm'

import {
  SHARE_SIGNED_URL_TTL_SECONDS,
  SHARE_RATE_LIMIT,
} from '#/lib/constants'
import {
  buildSharePath,
  generateShareToken,
  resolveShareStatus,
} from '#/lib/share-token'
import { checkRateLimit } from '#/lib/rate-limit'
import {
  createShareLinkSchema,
  resolveShareTokenSchema,
  revokeShareLinkSchema,
} from '#/lib/validation'
import { firstOrNull, firstOrThrow } from '#/server/db-helpers.server'

export const createShareLink = createServerFn({ method: 'POST' })
  .validator(createShareLinkSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, shareLinks } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: files.id })
        .from(files)
        .where(and(eq(files.id, data.fileId), eq(files.userId, userId)))
        .limit(1),
      'Súbor neexistuje',
    )

    const token = generateShareToken()
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000)

    const created = firstOrThrow(
      await db
        .insert(shareLinks)
        .values({
          fileId: data.fileId,
          token,
          expiresAt,
          createdBy: userId,
        })
        .returning({
          id: shareLinks.id,
          token: shareLinks.token,
          expiresAt: shareLinks.expiresAt,
          createdAt: shareLinks.createdAt,
          fileId: shareLinks.fileId,
        }),
      'Nepodarilo sa vytvoriť odkaz',
    )

    return {
      ...created,
      path: buildSharePath(created.token),
      status: 'active' as const,
    }
  })

export const listShareLinks = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, shareLinks } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const rows = await db
      .select({
        id: shareLinks.id,
        token: shareLinks.token,
        expiresAt: shareLinks.expiresAt,
        revokedAt: shareLinks.revokedAt,
        createdAt: shareLinks.createdAt,
        fileId: shareLinks.fileId,
        fileName: files.name,
        fileSize: files.size,
        mimeType: files.mimeType,
      })
      .from(shareLinks)
      .innerJoin(files, eq(files.id, shareLinks.fileId))
      .where(eq(shareLinks.createdBy, userId))
      .orderBy(desc(shareLinks.createdAt))

    return rows.map((row) => ({
      id: row.id,
      token: row.token,
      path: buildSharePath(row.token),
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
      fileId: row.fileId,
      fileName: row.fileName,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      status: resolveShareStatus(row),
    }))
  },
)

export const revokeShareLink = createServerFn({ method: 'POST' })
  .validator(revokeShareLinkSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { shareLinks } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const existing = firstOrThrow(
      await db
        .select({
          id: shareLinks.id,
          revokedAt: shareLinks.revokedAt,
        })
        .from(shareLinks)
        .where(
          and(eq(shareLinks.id, data.shareId), eq(shareLinks.createdBy, userId)),
        )
        .limit(1),
      'Odkaz neexistuje',
    )

    if (existing.revokedAt != null) {
      return { ok: true as const, alreadyRevoked: true }
    }

    await db
      .update(shareLinks)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(shareLinks.id, data.shareId),
          eq(shareLinks.createdBy, userId),
          isNull(shareLinks.revokedAt),
        ),
      )

    return { ok: true as const, alreadyRevoked: false }
  })

/**
 * Public resolver used by /s/$token.
 * Never returns uploadthingKey to the client — only a short-lived signed URL.
 */
export const resolvePublicShare = createServerFn({ method: 'GET' })
  .validator(resolveShareTokenSchema)
  .handler(async ({ data }) => {
    const { db } = await import('#/db')
    const { files, shareLinks } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    setResponseHeader('Cache-Control', 'no-store')

    const ip = getRequestIP() ?? 'unknown'
    const rate = checkRateLimit(`share:${ip}`, SHARE_RATE_LIMIT)
    if (!rate.ok) {
      setResponseStatus(429)
      setResponseHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))),
      )
      return {
        status: 'rate_limited' as const,
        retryAfterMs: rate.retryAfterMs,
      }
    }

    const row = firstOrNull(
      await db
        .select({
          expiresAt: shareLinks.expiresAt,
          revokedAt: shareLinks.revokedAt,
          fileName: files.name,
          uploadthingKey: files.uploadthingKey,
        })
        .from(shareLinks)
        .innerJoin(files, eq(files.id, shareLinks.fileId))
        .where(eq(shareLinks.token, data.token))
        .limit(1),
    )

    if (!row) {
      setResponseStatus(410)
      return { status: 'gone' as const, reason: 'not_found' as const }
    }

    const linkStatus = resolveShareStatus(row)
    if (linkStatus !== 'active') {
      setResponseStatus(410)
      return {
        status: 'gone' as const,
        reason: linkStatus,
        fileName: row.fileName,
      }
    }

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error('UPLOADTHING_TOKEN nie je nastavený')
    }

    const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
      expiresIn: SHARE_SIGNED_URL_TTL_SECONDS,
    })

    return {
      status: 'ok' as const,
      url: ufsUrl,
      fileName: row.fileName,
      signedUrlExpiresIn: SHARE_SIGNED_URL_TTL_SECONDS,
    }
  })
