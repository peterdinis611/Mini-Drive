import { createUploadthing, UploadThingError } from 'uploadthing/server'
import type { FileRouter } from 'uploadthing/server'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { files, folders } from '#/db/schema'
import { auth } from '#/lib/auth'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { resolveStoredMimeType } from '#/lib/mime'
import { fileNameSchema } from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'
import {
  archiveAndReplaceFile,
  assertStorageQuota,
} from '#/server/storage.server'

const f = createUploadthing()

const uploadInputSchema = z.object({
  folderId: z
    .union([z.uuid(), z.null()])
    .optional()
    .transform((value) => value ?? null),
  /** When set, archive current blob and replace with the uploaded file. */
  replaceFileId: z.uuid().optional().nullable(),
  /** When set with a new upload (not replace), force this display name. */
  saveAsName: z.string().trim().min(1).max(255).optional().nullable(),
})

export const uploadRouter = {
  driveUploader: f(
    {
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
    .middleware(async ({ req, input, files: incoming }) => {
      const session = await auth.api.getSession({ headers: req.headers })
      if (!session) {
        throw new UploadThingError('Musíš byť prihlásený')
      }

      const userId = session.user.id
      const totalIncoming = incoming.reduce((sum, file) => sum + file.size, 0)

      if (input.replaceFileId) {
        const existing = firstOrThrow(
          await db
            .select({ id: files.id, size: files.size, userId: files.userId })
            .from(files)
            .where(
              and(
                eq(files.id, input.replaceFileId),
                eq(files.userId, userId),
                isNull(files.deletedAt),
              ),
            )
            .limit(1),
          'Súbor na nahradenie neexistuje',
        )

        try {
          await assertStorageQuota(userId, totalIncoming, {
            releasingBytes: existing.size,
          })
        } catch (error) {
          throw new UploadThingError(
            error instanceof Error ? error.message : 'Kvóta prekročená',
          )
        }

        return {
          userId,
          folderId: input.folderId,
          replaceFileId: input.replaceFileId as string,
          saveAsName: input.saveAsName ?? null,
        }
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
                  eq(folders.userId, userId),
                  isNull(folders.deletedAt),
                ),
              )
              .limit(1),
            'Priečinok neexistuje',
          )
        } catch {
          throw new UploadThingError('Priečinok neexistuje')
        }
      }

      try {
        await assertStorageQuota(userId, totalIncoming)
      } catch (error) {
        throw new UploadThingError(
          error instanceof Error ? error.message : 'Kvóta prekročená',
        )
      }

      return {
        userId,
        folderId: input.folderId,
        replaceFileId: null as string | null,
        saveAsName: input.saveAsName ?? null,
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const displayName = metadata.saveAsName || file.name
      const parsedName = fileNameSchema.safeParse(displayName)
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

      const mimeType = resolveStoredMimeType(
        file.type || '',
        parsedName.data,
      )

      if (metadata.replaceFileId) {
        try {
          const replaced = await archiveAndReplaceFile({
            userId: metadata.userId,
            fileId: metadata.replaceFileId,
            uploadthingKey: file.key,
            size: file.size,
            mimeType,
            name: parsedName.data,
          })
          return {
            fileId: replaced.id,
            name: replaced.name,
            replaced: true,
            version: replaced.currentVersion,
          }
        } catch (error) {
          throw new UploadThingError(
            error instanceof Error ? error.message : 'Nahradenie zlyhalo',
          )
        }
      }

      try {
        await assertStorageQuota(metadata.userId, file.size)
      } catch (error) {
        throw new UploadThingError(
          error instanceof Error ? error.message : 'Kvóta prekročená',
        )
      }

      const created = firstOrThrow(
        await db
          .insert(files)
          .values({
            userId: metadata.userId,
            folderId: metadata.folderId ?? null,
            name: parsedName.data,
            size: file.size,
            mimeType,
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
        replaced: false,
      }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
