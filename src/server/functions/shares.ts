import { createServerFn } from '@tanstack/react-start'
import {
  getRequestHeaders,
  getRequestIP,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'

import {
  CREATE_SHARE_RATE_LIMIT,
  SHARE_ACCESS_LOG_LIMIT,
  SHARE_RATE_LIMIT,
  SHARE_SIGNED_URL_TTL_SECONDS,
} from '#/lib/constants'
import { truncateUserAgent } from '#/lib/share-audit'
import { hashAuditIp } from '#/lib/share-audit-hash'
import {
  buildSharePath,
  generateShareToken,
  resolveShareStatus,
} from '#/lib/share-token'
import { checkRateLimit } from '#/lib/rate-limit'
import {
  createShareLinkSchema,
  listShareAccessLogsSchema,
  resolveShareTokenSchema,
  revokeShareLinkSchema,
} from '#/lib/validation'
import { firstOrNull, firstOrThrow } from '#/server/db-helpers.server'

function resolveAuditIpPepper(): string {
  return (
    process.env.AUDIT_IP_PEPPER?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    ''
  )
}

export const createShareLink = createServerFn({ method: 'POST' })
  .validator(createShareLinkSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, shareLinks } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    const rate = checkRateLimit(
      `share-create:${userId}`,
      CREATE_SHARE_RATE_LIMIT,
    )
    if (!rate.ok) {
      throw new Error(
        `Príliš veľa zdieľaní. Skús o ${Math.max(1, Math.ceil(rate.retryAfterMs / 1000))} s.`,
      )
    }

    const file = firstOrThrow(
      await db
        .select({
          id: files.id,
          name: files.name,
          size: files.size,
          mimeType: files.mimeType,
          uploadthingKey: files.uploadthingKey,
        })
        .from(files)
        .where(
          and(
            eq(files.id, data.fileId),
            eq(files.userId, userId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1),
      'Súbor neexistuje',
    )

    const {
      scanUploadThingFileForShare,
      virusScanBlockMessage,
    } = await import('#/server/virus-scan.server')
    const scan = await scanUploadThingFileForShare({
      uploadthingKey: file.uploadthingKey,
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.size,
    })
    if (scan.verdict === 'infected' || scan.verdict === 'error') {
      throw new Error(virusScanBlockMessage(scan))
    }

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
      accessCount: 0,
    }
  })

export const listShareLinks = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, shareAccessLogs, shareLinks } = await import('#/db/schema')

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

    const ids = rows.map((row) => row.id)
    const counts = new Map<string, number>()

    if (ids.length > 0) {
      const countRows = await db
        .select({
          shareLinkId: shareAccessLogs.shareLinkId,
          total: count(shareAccessLogs.id),
        })
        .from(shareAccessLogs)
        .where(inArray(shareAccessLogs.shareLinkId, ids))
        .groupBy(shareAccessLogs.shareLinkId)

      for (const row of countRows) {
        counts.set(row.shareLinkId, Number(row.total))
      }
    }

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
      accessCount: counts.get(row.id) ?? 0,
    }))
  },
)

export const listShareAccessLogs = createServerFn({ method: 'GET' })
  .validator(listShareAccessLogsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { shareAccessLogs, shareLinks } = await import('#/db/schema')

    const session = await requireSession()
    const userId = session.user.id

    firstOrThrow(
      await db
        .select({ id: shareLinks.id })
        .from(shareLinks)
        .where(
          and(
            eq(shareLinks.id, data.shareId),
            eq(shareLinks.createdBy, userId),
          ),
        )
        .limit(1),
      'Odkaz neexistuje',
    )

    const logs = await db
      .select({
        id: shareAccessLogs.id,
        accessedAt: shareAccessLogs.accessedAt,
        ipAddress: shareAccessLogs.ipAddress,
        userAgent: shareAccessLogs.userAgent,
      })
      .from(shareAccessLogs)
      .where(eq(shareAccessLogs.shareLinkId, data.shareId))
      .orderBy(desc(shareAccessLogs.accessedAt))
      .limit(SHARE_ACCESS_LOG_LIMIT)

    return { logs, limit: SHARE_ACCESS_LOG_LIMIT }
  })

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
 * Successful opens are written to share_access_logs.
 */
export const resolvePublicShare = createServerFn({ method: 'GET' })
  .validator(resolveShareTokenSchema)
  .handler(async ({ data }) => {
    const { db } = await import('#/db')
    const { files, shareAccessLogs, shareLinks } = await import('#/db/schema')
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
          shareLinkId: shareLinks.id,
          expiresAt: shareLinks.expiresAt,
          revokedAt: shareLinks.revokedAt,
          fileName: files.name,
          fileSize: files.size,
          mimeType: files.mimeType,
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
      throw new Error('Úložisko nie je nakonfigurované (chýba token).')
    }

    const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
      expiresIn: SHARE_SIGNED_URL_TTL_SECONDS,
    })

    const headers = getRequestHeaders()
    const userAgent = truncateUserAgent(headers.get('user-agent'))

    // Fire-and-forget style: await so the row exists before response, but never fail the share.
    try {
      const pepper =
        resolveAuditIpPepper() || 'dev-insecure-audit-pepper'
      await db.insert(shareAccessLogs).values({
        shareLinkId: row.shareLinkId,
        ipAddress: hashAuditIp(ip, pepper),
        userAgent,
      })
    } catch {
      // Audit must not break delivery of a valid share.
    }

    return {
      status: 'ok' as const,
      url: ufsUrl,
      fileName: row.fileName,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      signedUrlExpiresIn: SHARE_SIGNED_URL_TTL_SECONDS,
    }
  })
