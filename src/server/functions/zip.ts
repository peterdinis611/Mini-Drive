import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import JSZip from 'jszip'

import {
  bulkDownloadUrlsSchema,
  zipFolderSchema,
} from '#/lib/validation'
import { collectDescendantIds } from '#/lib/folder-ops'
import { firstOrThrow } from '#/server/db-helpers.server'

const MAX_ZIP_BYTES = 80 * 1024 * 1024
const MAX_ZIP_FILES = 200

/** Signed download URLs for multi-select / drag-out. */
export const getBulkDownloadUrls = createServerFn({ method: 'POST' })
  .validator(bulkDownloadUrlsSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    const session = await requireSession()
    const userId = session.user.id

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error('Úložisko nie je nakonfigurované (chýba token).')
    }

    const rows = await db
      .select({
        id: files.id,
        name: files.name,
        uploadthingKey: files.uploadthingKey,
        size: files.size,
        mimeType: files.mimeType,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.id, data.fileIds),
        ),
      )

    const items = await Promise.all(
      rows.map(async (row) => {
        try {
          const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
            expiresIn: 60 * 15,
          })
          return {
            id: row.id,
            name: row.name,
            url: ufsUrl,
            size: row.size,
            mimeType: row.mimeType,
          }
        } catch {
          return null
        }
      }),
    )

    return items.filter((item): item is NonNullable<typeof item> => item !== null)
  })

/**
 * Build a zip of a folder (and nested folders) as base64.
 * Soft limits keep responses manageable for the server-fn transport.
 */
export const downloadFolderZip = createServerFn({ method: 'POST' })
  .validator(zipFolderSchema)
  .handler(async ({ data }) => {
    const { requireSession } = await import('#/server/auth.server')
    const { db } = await import('#/db')
    const { files, folders } = await import('#/db/schema')
    const { utapi } = await import('#/server/utapi.server')

    const session = await requireSession()
    const userId = session.user.id

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error('Úložisko nie je nakonfigurované (chýba token).')
    }

    const root = firstOrThrow(
      await db
        .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
        .from(folders)
        .where(
          and(
            eq(folders.id, data.folderId),
            eq(folders.userId, userId),
            isNull(folders.deletedAt),
          ),
        )
        .limit(1),
      'Priečinok neexistuje',
    )

    const allFolders = await db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
      })
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))

    const folderIds = collectDescendantIds(data.folderId, allFolders)

    const fileRows = await db
      .select({
        id: files.id,
        name: files.name,
        folderId: files.folderId,
        uploadthingKey: files.uploadthingKey,
        size: files.size,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isNull(files.deletedAt),
          inArray(files.folderId, folderIds),
        ),
      )

    if (fileRows.length === 0) {
      throw new Error('Priečinok je prázdny')
    }
    if (fileRows.length > MAX_ZIP_FILES) {
      throw new Error(`Príliš veľa súborov (max ${MAX_ZIP_FILES})`)
    }

    const totalBytes = fileRows.reduce((sum, row) => sum + row.size, 0)
    if (totalBytes > MAX_ZIP_BYTES) {
      throw new Error('Priečinok je príliš veľký na zip (max 80 MB)')
    }

    const foldersById = new Map(allFolders.map((folder) => [folder.id, folder]))

    function relativePath(folderId: string | null, fileName: string) {
      const parts: string[] = [fileName]
      let current = folderId
      const seen = new Set<string>()
      while (current && current !== data.folderId && !seen.has(current)) {
        seen.add(current)
        const folder = foldersById.get(current)
        if (!folder) break
        parts.unshift(folder.name)
        current = folder.parentId
      }
      return parts.join('/')
    }

    const zip = new JSZip()
    let added = 0

    for (const row of fileRows) {
      try {
        const { ufsUrl } = await utapi.generateSignedURL(row.uploadthingKey, {
          expiresIn: 60 * 5,
        })
        const response = await fetch(ufsUrl)
        if (!response.ok) continue
        const buffer = Buffer.from(await response.arrayBuffer())
        const path = relativePath(row.folderId, row.name)
        zip.file(path, buffer)
        added += 1
      } catch {
        // skip broken blobs
      }
    }

    if (added === 0) {
      throw new Error('Nepodarilo sa stiahnuť žiadny súbor')
    }

    const base64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const safeName = root.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 80)
    return {
      name: `${safeName || 'folder'}.zip`,
      base64,
      fileCount: added,
    }
  })
