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
      setPercent(0)
      setQueue([])
      toast.success(
        count === 1 ? 'Súbor nahraný' : `Nahraných ${count} súborov`,
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
      folderId: string | null,
    ) => {
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

      setActiveFolderId(folderId)
      setQueue(
        files.map((file, index) => ({
          id: `${file.name}-${file.size}-${index}`,
          file,
          kind: getFileKind(file.type, file.name),
        })),
      )

      try {
        await startUpload(files, { folderId })
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
