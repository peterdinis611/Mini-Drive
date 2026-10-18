import { useEffect, useState } from 'react'

import type { DriveFile } from '#/components/files/types'
import { isImageMimeType, preloadImages } from '#/lib/preload'
import { getImagePreviewUrls } from '#/server/functions/files'

export function useImagePreviews(
  files: DriveFile[],
  enabled: boolean,
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})

  const imageIds = files
    .filter((file) => isImageMimeType(file.mimeType))
    .map((file) => file.id)
    .slice(0, 24)
    .join('|')

  useEffect(() => {
    if (!enabled || !imageIds) {
      setUrls({})
      return
    }

    let cancelled = false
    const ids = imageIds.split('|')

    void getImagePreviewUrls({ data: { fileIds: ids } })
      .then((result) => {
        if (cancelled) return
        setUrls(result)
        preloadImages(Object.values(result))
      })
      .catch(() => {
        if (!cancelled) setUrls({})
      })

    return () => {
      cancelled = true
    }
  }, [enabled, imageIds])

  return urls
}
