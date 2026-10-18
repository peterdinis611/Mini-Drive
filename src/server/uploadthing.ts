import { createUploadthing, UploadThingError } from 'uploadthing/server'
import type { FileRouter } from 'uploadthing/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { files, folders } from '#/db/schema'
import { auth } from '#/lib/auth'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { firstOrThrow } from '#/server/db-helpers.server'

const f = createUploadthing()

const uploadInputSchema = z.object({
  folderId: z.string().uuid().nullable(),
})

export const uploadRouter = {
  driveUploader: f(
    {
      image: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
      video: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
      audio: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
      pdf: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
      text: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
      blob: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
        acl: 'private',
      },
    },
    { awaitServerData: true },
  )
    .input(uploadInputSchema)
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers })
      if (!session) {
        throw new UploadThingError('Musíš byť prihlásený')
      }

      if (input.folderId) {
        try {
          firstOrThrow(
            await db
              .select({ id: folders.id })
              .from(folders)
              .where(
                and(
                  eq(folders.id, input.folderId),
                  eq(folders.userId, session.user.id),
                ),
              )
              .limit(1),
            'Priečinok neexistuje',
          )
        } catch {
          throw new UploadThingError('Priečinok neexistuje')
        }
      }

      return {
        userId: session.user.id,
        folderId: input.folderId,
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const created = firstOrThrow(
        await db
          .insert(files)
          .values({
            userId: metadata.userId,
            folderId: metadata.folderId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadthingKey: file.key,
          })
          .returning({
            id: files.id,
            name: files.name,
            size: files.size,
            mimeType: files.mimeType,
            folderId: files.folderId,
            createdAt: files.createdAt,
          }),
        'Nepodarilo sa uložiť súbor',
      )

      return {
        fileId: created.id,
        name: created.name,
      }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
