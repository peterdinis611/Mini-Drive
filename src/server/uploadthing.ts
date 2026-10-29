import { and, eq, isNull } from 'drizzle-orm'
import type { FileRouter } from 'uploadthing/server'
import { createUploadthing, UploadThingError } from 'uploadthing/server'

import { db } from '#/db'
import { files, folders } from '#/db/schema'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { resolveStoredMimeType } from '#/lib/mime'
import {
  fileNameSchema,
  parseServerInput,
  uploadInputSchema,
} from '#/lib/validation'
import { firstOrThrow } from '#/server/db-helpers.server'
import {
  archiveAndReplaceFile,
  assertStorageQuota,
} from '#/server/storage.server'

const f = createUploadthing()

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
    .middleware(async ({ input: rawInput, files: incoming }) => {
      const { getSessionFromRequest } = await import('#/server/auth.server')
      const session = await getSessionFromRequest()
      if (!session) {
        throw new UploadThingError('Musíš byť prihlásený')
      }

      let input
      try {
        input = parseServerInput(uploadInputSchema, rawInput)
      } catch (error) {
        throw new UploadThingError(
          error instanceof Error ? error.message : 'Neplatný upload vstup',
        )
      }

      if (incoming.length === 0) {
        throw new UploadThingError('Nevybral si žiadny súbor')
      }
      if (incoming.length > UPLOAD_LIMITS.maxFileCount) {
        throw new UploadThingError(
          `Naraz môžeš nahrať najviac ${UPLOAD_LIMITS.maxFileCount} súborov`,
        )
      }
      for (const file of incoming) {
        if (file.size <= 0) {
          throw new UploadThingError(`Súbor „${file.name}“ je prázdny`)
        }
        if (file.size > UPLOAD_LIMITS.maxFileSizeBytes) {
          throw new UploadThingError(
            `Súbor „${file.name}“ prekračuje limit ${UPLOAD_LIMITS.maxFileSize}`,
          )
        }
        const nameCheck = fileNameSchema.safeParse(file.name)
        if (!nameCheck.success) {
          throw new UploadThingError(
            `„${file.name}“: ${nameCheck.error.issues[0]?.message ?? 'Neplatný názov'}`,
          )
        }
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

      const mimeType = resolveStoredMimeType(file.type || '', parsedName.data)

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
          void import('#/server/file-index.server').then(
            ({ indexUploadedFile }) =>
              indexUploadedFile({
                fileId: replaced.id,
                uploadthingKey: file.key,
                mimeType,
                name: replaced.name,
                size: replaced.size,
              }),
          )
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

      void import('#/server/file-index.server').then(({ indexUploadedFile }) =>
        indexUploadedFile({
          fileId: created.id,
          uploadthingKey: file.key,
          mimeType,
          name: created.name,
          size: created.size,
        }),
      )

      return {
        fileId: created.id,
        name: created.name,
        replaced: false,
      }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
