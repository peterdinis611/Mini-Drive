import { useCallback, useState } from 'react'

import { UPLOAD_LIMITS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { getFileKind } from '#/lib/file-kind'
import { toast } from '#/lib/toast'
import { useUploadThing } from '#/lib/uploadthing'
import { validateFilesForUpload } from '#/lib/validation'

export type UploadQueueItem = {
  id: string
  file: File
  kind: ReturnType<typeof getFileKind>
}

type Options = {
  onComplete?: (folderId: string | null, count: number) => void
}

export type UploadInput = {
  folderId: string | null
  replaceFileId?: string | null
  saveAsName?: string | null
}

export function useDriveUpload(options: Options = {}) {
  const [percent, setPercent] = useState(0)
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('driveUploader', {
    uploadProgressGranularity: 'fine',
    onUploadProgress: (p) => setPercent(p),
    onClientUploadComplete: (res) => {
      const count = res.length
      const dest = activeFolderId
      const replaced = res.some(
        (item) =>
          item.serverData &&
          typeof item.serverData === 'object' &&
          'replaced' in item.serverData &&
          Boolean((item.serverData as { replaced?: boolean }).replaced),
      )
      setPercent(0)
      setQueue([])
      toast.success(
        replaced
          ? 'Súbor uložený (nová verzia)'
          : count === 1
            ? 'Súbor nahraný'
            : `Nahraných ${count} súborov`,
      )
      options.onComplete?.(dest, count)
    },
    onUploadError: (error) => {
      setPercent(0)
      setQueue([])
      toast.error(getErrorMessage(error, 'Upload zlyhal'))
    },
  })

  const uploadFiles = useCallback(
    async (
      incoming: File[] | FileList | null | undefined,
      folderIdOrInput: string | null | UploadInput,
    ) => {
      const input: UploadInput =
        folderIdOrInput !== null &&
        typeof folderIdOrInput === 'object' &&
        'folderId' in folderIdOrInput
          ? folderIdOrInput
          : { folderId: folderIdOrInput as string | null }

      const validated = validateFilesForUpload(incoming)
      if (!validated.ok) {
        toast.error(validated.message)
        return
      }

      const { files } = validated
      if (
        incoming &&
        Array.from(incoming).length > UPLOAD_LIMITS.maxFileCount
      ) {
        toast.message(
          `Nahrám prvých ${UPLOAD_LIMITS.maxFileCount} súborov (limit).`,
        )
      }

      setActiveFolderId(input.folderId)
      setQueue(
        files.map((file, index) => ({
          id: `${file.name}-${file.size}-${index}`,
          file,
          kind: getFileKind(file.type, file.name),
        })),
      )

      try {
        await startUpload(files, {
          folderId: input.folderId,
          replaceFileId: input.replaceFileId ?? null,
          saveAsName: input.saveAsName ?? null,
        })
      } catch (error) {
        setPercent(0)
        setQueue([])
        toast.error(getErrorMessage(error, 'Upload zlyhal'))
      }
    },
    [startUpload],
  )

  return {
    uploadFiles,
    isUploading,
    percent,
    queue,
  }
}
