import { useEffect, useState } from 'react'

import type { DriveFile } from '#/components/files/types'
import { isImageMimeType } from '#/lib/mime'
import { preloadImages } from '#/lib/preload'
import { getImagePreviewUrls } from '#/server/functions/files'

const PREVIEW_TTL_MS = 4 * 60_000

type CacheEntry = {
  urls: Record<string, string>
  expiresAt: number
}

const previewCache = new Map<string, CacheEntry>()

function readCache(key: string): Record<string, string> | null {
  const entry = previewCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    previewCache.delete(key)
    return null
  }
  return entry.urls
}

function writeCache(key: string, urls: Record<string, string>) {
  previewCache.set(key, { urls, expiresAt: Date.now() + PREVIEW_TTL_MS })
  // Bound memory — keep newest ~40 folder/list windows.
  if (previewCache.size > 40) {
    const oldest = previewCache.keys().next().value
    if (oldest) previewCache.delete(oldest)
  }
}

export function useImagePreviews(
  files: DriveFile[],
  enabled: boolean,
): Record<string, string> {
  const imageIds = files
    .filter((file) => isImageMimeType(file.mimeType, file.name))
    .map((file) => file.id)
    .slice(0, 24)
    .join('|')

  const [urls, setUrls] = useState<Record<string, string>>(() =>
    enabled && imageIds ? (readCache(imageIds) ?? {}) : {},
  )

  useEffect(() => {
    if (!enabled || !imageIds) {
      setUrls({})
      return
    }

    const cached = readCache(imageIds)
    if (cached) {
      setUrls(cached)
      preloadImages(Object.values(cached))
      return
    }

    let cancelled = false
    const ids = imageIds.split('|')

    void getImagePreviewUrls({ data: { fileIds: ids } })
      .then((result) => {
        if (cancelled) return
        writeCache(imageIds, result)
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
