import { createUploadthing, UploadThingError } from 'uploadthing/server'
import type { FileRouter } from 'uploadthing/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { files, folders } from '#/db/schema'
import { auth } from '#/lib/auth'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { fileNameSchema } from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'

const f = createUploadthing()

const uploadInputSchema = z.object({
  folderId: z.string().uuid().nullable(),
})

export const uploadRouter = {
  driveUploader: f(
    {
      // ACL must match the app default on the UploadThing dashboard.
      // Per-route `acl` overrides require "Allow ACL overrides" to be enabled
      // (otherwise ingest returns 400).
      image: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
      },
      video: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
      },
      audio: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
      },
      pdf: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
      },
      text: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
      },
      blob: {
        maxFileSize: '32MB',
        maxFileCount: UPLOAD_LIMITS.maxFileCount,
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
      const parsedName = fileNameSchema.safeParse(file.name)
      if (!parsedName.success) {
        throw new UploadThingError(
          parsedName.error.issues[0]?.message ?? 'Neplatný názov súboru',
        )
      }

      if (file.size <= 0) {
        throw new UploadThingError('Súbor je prázdny')
      }

      if (file.size > UPLOAD_LIMITS.maxFileSizeBytes) {
        throw new UploadThingError(
          `Súbor prekračuje limit ${UPLOAD_LIMITS.maxFileSize}`,
        )
      }

      const created = firstOrThrow(
        await db
          .insert(files)
          .values({
            userId: metadata.userId,
            folderId: metadata.folderId,
            name: parsedName.data,
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
