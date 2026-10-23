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

function rotateSize(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180
  return {
    width:
      Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height:
      Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  }
}

export type CropExportOptions = {
  flipHorizontal?: boolean
  flipVertical?: boolean
  mimeType?: string
  quality?: number
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

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

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

  return new Promise((resolve, reject) => {
    out.toBlob(
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
