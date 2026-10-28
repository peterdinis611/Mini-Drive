import { createHash } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { files } from '#/db/schema'

const MAX_INDEX_CHARS = 80_000
const MAX_FETCH_BYTES = 4 * 1024 * 1024

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

function isPdf(mimeType: string, name: string) {
  return mimeType === 'application/pdf' || /\.pdf$/i.test(name)
}

async function extractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    const joined = Array.isArray(text) ? text.join('\n') : String(text ?? '')
    const cleaned = joined.replace(/\u0000/g, '').trim()
    return cleaned.length > 0 ? cleaned.slice(0, MAX_INDEX_CHARS) : null
  } catch {
    return null
  }
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
    } else if (isPdf(args.mimeType, args.name)) {
      contentText = await extractPdfText(buffer)
    }

    await db
      .update(files)
      .set({ contentHash, contentText })
      .where(eq(files.id, args.fileId))
  } catch {
    // Indexing is best-effort — never fail the upload.
  }
}
