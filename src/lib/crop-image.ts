import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    // Required for canvas export; UploadThing CDN allows anonymous reads.
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.src = src
  })
}

/** Bounding box after rotating a rectangle by degrees. */
export function rotateSize(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180
  return {
    width:
      Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height:
      Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  }
}

/** Freehand stroke in normalized image coordinates (0–1). */
export type DrawStroke = {
  color: string
  width: number
  /** Stroke width as fraction of image min(w,h); typical 0.004–0.02 */
  widthNorm?: number
  points: Array<{ x: number; y: number }>
}

export type ImageExportOptions = {
  flipHorizontal?: boolean
  flipVertical?: boolean
  mimeType?: string
  quality?: number
  /** 1 = unchanged */
  brightness?: number
  /** 1 = unchanged */
  contrast?: number
  strokes?: DrawStroke[]
}

export type CropExportOptions = ImageExportOptions

function applyCanvasFilter(
  ctx: CanvasRenderingContext2D,
  brightness = 1,
  contrast = 1,
) {
  const b = Number.isFinite(brightness) ? brightness : 1
  const c = Number.isFinite(contrast) ? contrast : 1
  if (b === 1 && c === 1) {
    ctx.filter = 'none'
    return
  }
  ctx.filter = `brightness(${b}) contrast(${c})`
}

function paintStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawStroke[],
  width: number,
  height: number,
) {
  const minDim = Math.min(width, height)
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue
    const lineWidth =
      stroke.widthNorm != null
        ? Math.max(1, stroke.widthNorm * minDim)
        : stroke.width
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const first = stroke.points[0]!
    ctx.moveTo(first.x * width, first.y * height)
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i]!
      ctx.lineTo(point.x * width, point.y * height)
    }
    ctx.stroke()
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Export obrázka zlyhal'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Full-frame export with rotation, flip, filters and optional annotations.
 * Used when saving/downloading without a crop region.
 */
export async function getTransformedImageBlob(
  imageSrc: string,
  rotation = 0,
  options: ImageExportOptions = {},
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const {
    flipHorizontal = false,
    flipVertical = false,
    mimeType = 'image/jpeg',
    quality = 0.92,
    brightness = 1,
    contrast = 1,
    strokes = [],
  } = options

  const source = document.createElement('canvas')
  source.width = image.width
  source.height = image.height
  const sourceCtx = source.getContext('2d')
  if (!sourceCtx) throw new Error('Canvas nie je dostupný')

  applyCanvasFilter(sourceCtx, brightness, contrast)
  sourceCtx.drawImage(image, 0, 0)
  sourceCtx.filter = 'none'
  if (strokes.length > 0) {
    paintStrokes(sourceCtx, strokes, source.width, source.height)
  }

  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    source.width,
    source.height,
    rotation,
  )

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bBoxWidth))
  canvas.height = Math.max(1, Math.round(bBoxHeight))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas nie je dostupný')

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  ctx.translate(-source.width / 2, -source.height / 2)
  ctx.drawImage(source, 0, 0)

  return canvasToBlob(canvas, mimeType, quality)
}

/** Renders a cropped (and optionally rotated/flipped) region to a Blob. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  options: CropExportOptions = {},
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const {
    flipHorizontal = false,
    flipVertical = false,
    mimeType = 'image/jpeg',
    quality = 0.92,
    brightness = 1,
    contrast = 1,
    strokes = [],
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas nie je dostupný')

  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  )

  canvas.width = Math.max(1, Math.round(bBoxWidth))
  canvas.height = Math.max(1, Math.round(bBoxHeight))

  // Draw filtered + annotated source into a temp canvas first
  const source = document.createElement('canvas')
  source.width = image.width
  source.height = image.height
  const sourceCtx = source.getContext('2d')
  if (!sourceCtx) throw new Error('Canvas nie je dostupný')
  applyCanvasFilter(sourceCtx, brightness, contrast)
  sourceCtx.drawImage(image, 0, 0)
  sourceCtx.filter = 'none'
  if (strokes.length > 0) {
    paintStrokes(sourceCtx, strokes, source.width, source.height)
  }

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(source, 0, 0)

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(pixelCrop.width))
  out.height = Math.max(1, Math.round(pixelCrop.height))
  const outCtx = out.getContext('2d')
  if (!outCtx) throw new Error('Canvas nie je dostupný')

  outCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    out.width,
    out.height,
  )

  return canvasToBlob(out, mimeType, quality)
}

export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(href)
}

export function withCroppedName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return `${fileName}-cropped.jpg`
  return `${fileName.slice(0, dot)}-cropped${fileName.slice(dot)}`
}

export function withEditedName(fileName: string, suffix = 'edited') {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return `${fileName}-${suffix}.jpg`
  return `${fileName.slice(0, dot)}-${suffix}${fileName.slice(dot)}`
}

/** Clamp zoom to a sensible preview range. */
export function clampViewZoom(value: number, min = 0.25, max = 5) {
  if (!Number.isFinite(value)) return 1
  return Math.min(max, Math.max(min, Number(value.toFixed(2))))
}
