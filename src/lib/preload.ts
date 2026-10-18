const preloaded = new Set<string>()

/** Warm the browser cache for image URLs (thumbnails / hero assets). */
export function preloadImages(urls: Array<string | null | undefined>): void {
  if (typeof window === 'undefined') return

  for (const url of urls) {
    if (!url || preloaded.has(url)) continue
    preloaded.add(url)

    const img = new Image()
    img.decoding = 'async'
    img.src = url
  }
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}
