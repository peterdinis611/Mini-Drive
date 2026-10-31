import exifr from 'exifr'

/** Technical / camera metadata extracted from the image file (EXIF/XMP/IPTC). */
export type ImageFileMeta = {
  make?: string
  model?: string
  lens?: string
  takenAt?: string
  fNumber?: number
  exposureTime?: string
  iso?: number
  focalLengthMm?: number
  width?: number
  height?: number
  orientation?: number
  software?: string
  colorSpace?: string
  gps?: { lat: number; lng: number }
}

export type ImageFileMetaRow = {
  label: string
  value: string
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function formatExposureTime(value: unknown): string | undefined {
  const n = asFiniteNumber(value)
  if (n == null || n <= 0) return undefined
  if (n >= 1) {
    return Number.isInteger(n) ? `${n} s` : `${n.toFixed(1)} s`
  }
  const denom = Math.round(1 / n)
  return denom > 1 ? `1/${denom} s` : `${n} s`
}

function formatTakenAt(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
    return value.trim()
  }
  return undefined
}

function formatColorSpace(value: unknown): string | undefined {
  if (typeof value === 'string') return asNonEmptyString(value)
  const n = asFiniteNumber(value)
  if (n === 1) return 'sRGB'
  if (n === 2) return 'Adobe RGB'
  if (n === 65535) return 'Uncalibrated'
  return n != null ? String(n) : undefined
}

/** Normalize raw exifr output into a stable, UI-friendly shape. */
export function normalizeImageFileMeta(
  raw: Record<string, unknown> | null | undefined,
): ImageFileMeta | null {
  if (!raw || typeof raw !== 'object') return null

  const make = asNonEmptyString(raw.Make)
  const model = asNonEmptyString(raw.Model)
  const lens =
    asNonEmptyString(raw.LensModel) ?? asNonEmptyString(raw.LensMake)
  const takenAt =
    formatTakenAt(raw.DateTimeOriginal) ??
    formatTakenAt(raw.CreateDate) ??
    formatTakenAt(raw.ModifyDate)
  const fNumber = asFiniteNumber(raw.FNumber) ?? asFiniteNumber(raw.ApertureValue)
  const exposureTime = formatExposureTime(raw.ExposureTime)
  const iso =
    asFiniteNumber(raw.ISO) ??
    asFiniteNumber(raw.ISOSpeedRatings) ??
    asFiniteNumber(raw.PhotographicSensitivity)
  const focalLengthMm = asFiniteNumber(raw.FocalLength)
  const width =
    asFiniteNumber(raw.ExifImageWidth) ??
    asFiniteNumber(raw.ImageWidth) ??
    asFiniteNumber(raw.PixelXDimension)
  const height =
    asFiniteNumber(raw.ExifImageHeight) ??
    asFiniteNumber(raw.ImageHeight) ??
    asFiniteNumber(raw.PixelYDimension)
  const orientation = asFiniteNumber(raw.Orientation)
  const software = asNonEmptyString(raw.Software)
  const colorSpace = formatColorSpace(raw.ColorSpace)

  const lat = asFiniteNumber(raw.latitude) ?? asFiniteNumber(raw.GPSLatitude)
  const lng = asFiniteNumber(raw.longitude) ?? asFiniteNumber(raw.GPSLongitude)
  const gps =
    lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : undefined

  const meta: ImageFileMeta = {
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
    ...(lens ? { lens } : {}),
    ...(takenAt ? { takenAt } : {}),
    ...(fNumber != null ? { fNumber } : {}),
    ...(exposureTime ? { exposureTime } : {}),
    ...(iso != null ? { iso } : {}),
    ...(focalLengthMm != null ? { focalLengthMm } : {}),
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
    ...(orientation != null ? { orientation } : {}),
    ...(software ? { software } : {}),
    ...(colorSpace ? { colorSpace } : {}),
    ...(gps ? { gps } : {}),
  }

  return Object.keys(meta).length > 0 ? meta : null
}

/**
 * Read EXIF/XMP/IPTC from an image URL or blob.
 * Returns null when the file has no useful tags (or fetch/parse fails).
 */
export async function readImageFileMeta(
  source: string | Blob | ArrayBuffer | File,
): Promise<ImageFileMeta | null> {
  try {
    const raw = (await exifr.parse(source, {
      // GPS helpers (latitude/longitude) + common camera tags
      gps: true,
      pick: [
        'Make',
        'Model',
        'LensModel',
        'LensMake',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'FNumber',
        'ApertureValue',
        'ExposureTime',
        'ISO',
        'ISOSpeedRatings',
        'PhotographicSensitivity',
        'FocalLength',
        'ExifImageWidth',
        'ExifImageHeight',
        'ImageWidth',
        'ImageHeight',
        'PixelXDimension',
        'PixelYDimension',
        'Orientation',
        'Software',
        'ColorSpace',
        'latitude',
        'longitude',
        'GPSLatitude',
        'GPSLongitude',
      ],
    })) as Record<string, unknown> | undefined
    return normalizeImageFileMeta(raw)
  } catch {
    return null
  }
}

function formatTakenAtDisplay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  try {
    return new Intl.DateTimeFormat('sk-SK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return iso
  }
}

/** Flat label/value rows for the image viewer meta panel. */
export function formatImageFileMetaRows(
  meta: ImageFileMeta,
): ImageFileMetaRow[] {
  const rows: ImageFileMetaRow[] = []

  const camera = [meta.make, meta.model].filter(Boolean).join(' ')
  if (camera) rows.push({ label: 'Aparát', value: camera })
  if (meta.lens) rows.push({ label: 'Objektív', value: meta.lens })
  if (meta.takenAt) {
    rows.push({ label: 'Nasnímané', value: formatTakenAtDisplay(meta.takenAt) })
  }

  const exposureBits = [
    meta.fNumber != null ? `f/${Number(meta.fNumber.toFixed(1))}` : null,
    meta.exposureTime ?? null,
    meta.iso != null ? `ISO ${Math.round(meta.iso)}` : null,
    meta.focalLengthMm != null
      ? `${Number(meta.focalLengthMm.toFixed(1))} mm`
      : null,
  ].filter(Boolean)
  if (exposureBits.length > 0) {
    rows.push({ label: 'Expozícia', value: exposureBits.join(' · ') })
  }

  if (meta.width != null && meta.height != null) {
    rows.push({
      label: 'Rozlíšenie (EXIF)',
      value: `${Math.round(meta.width)}×${Math.round(meta.height)}`,
    })
  }
  if (meta.orientation != null) {
    rows.push({ label: 'Orientácia', value: String(meta.orientation) })
  }
  if (meta.colorSpace) {
    rows.push({ label: 'Farebný priestor', value: meta.colorSpace })
  }
  if (meta.software) rows.push({ label: 'Softvér', value: meta.software })
  if (meta.gps) {
    rows.push({
      label: 'GPS',
      value: `${meta.gps.lat.toFixed(5)}, ${meta.gps.lng.toFixed(5)}`,
    })
  }

  return rows
}

export function imageFileMetaMapsUrl(gps: {
  lat: number
  lng: number
}): string {
  return `https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lng}#map=15/${gps.lat}/${gps.lng}`
}
