import { createHash } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { files } from '#/db/schema'

const MAX_INDEX_CHARS = 80_000
const MAX_FETCH_BYTES = 2 * 1024 * 1024

function isIndexableText(mimeType: string, name: string) {
  if (mimeType.startsWith('text/')) return true
  if (
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript'
  ) {
    return true
  }
  return /\.(md|txt|csv|tsv|json|xml|html?|css|js|ts|tsx|jsx|py|go|rs|sql|yml|yaml|toml|log)$/i.test(
    name,
  )
}

export async function indexUploadedFile(args: {
  fileId: string
  uploadthingKey: string
  mimeType: string
  name: string
  size: number
}) {
  try {
    const { utapi } = await import('#/server/utapi.server')
    const { ufsUrl } = await utapi.generateSignedURL(args.uploadthingKey, {
      expiresIn: 60 * 5,
    })

    const response = await fetch(ufsUrl)
    if (!response.ok) return

    const arrayBuffer = await response.arrayBuffer()
    const slice =
      arrayBuffer.byteLength > MAX_FETCH_BYTES
        ? arrayBuffer.slice(0, MAX_FETCH_BYTES)
        : arrayBuffer
    const buffer = Buffer.from(new Uint8Array(slice))

    const contentHash = createHash('sha256').update(buffer).digest('hex')
    let contentText: string | null = null

    if (isIndexableText(args.mimeType, args.name)) {
      contentText = buffer
        .toString('utf8')
        .replace(/\u0000/g, '')
        .slice(0, MAX_INDEX_CHARS)
    }

    await db
      .update(files)
      .set({ contentHash, contentText })
      .where(eq(files.id, args.fileId))
  } catch {
    // Indexing is best-effort — never fail the upload.
  }
}
