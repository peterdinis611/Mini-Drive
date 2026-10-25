const PREFIX = 'mini-drive:image-meta:'

export type ImageMeta = {
  caption: string
  altText: string
}

export function loadImageMeta(
  fileId: string | undefined,
  fallbackAlt: string,
): ImageMeta {
  if (!fileId || typeof localStorage === 'undefined') {
    return { caption: '', altText: fallbackAlt }
  }
  try {
    const raw = localStorage.getItem(`${PREFIX}${fileId}`)
    if (!raw) return { caption: '', altText: fallbackAlt }
    const parsed = JSON.parse(raw) as Partial<ImageMeta>
    return {
      caption: typeof parsed.caption === 'string' ? parsed.caption : '',
      altText:
        typeof parsed.altText === 'string' && parsed.altText.trim()
          ? parsed.altText
          : fallbackAlt,
    }
  } catch {
    return { caption: '', altText: fallbackAlt }
  }
}

export function saveImageMeta(fileId: string | undefined, meta: ImageMeta) {
  if (!fileId || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${PREFIX}${fileId}`, JSON.stringify(meta))
  } catch {
    // quota / private mode — ignore
  }
}
