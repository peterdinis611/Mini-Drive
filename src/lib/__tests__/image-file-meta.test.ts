import { beforeEach, describe, expect, it, vi } from 'vitest'

const parseMock = vi.fn()

vi.mock('exifr', () => ({
  default: {
    parse: (...args: unknown[]) => parseMock(...args),
  },
}))

describe('image-file-meta', () => {
  beforeEach(() => {
    parseMock.mockReset()
    vi.resetModules()
  })

  it('normalizeImageFileMeta maps camera + exposure fields', async () => {
    const { normalizeImageFileMeta } = await import('#/lib/image-file-meta')
    const meta = normalizeImageFileMeta({
      Make: 'Fujifilm',
      Model: 'X-T5',
      LensModel: 'XF33mmF1.4 R LM WR',
      DateTimeOriginal: new Date('2024-06-15T14:30:00Z'),
      FNumber: 1.4,
      ExposureTime: 1 / 500,
      ISO: 200,
      FocalLength: 33,
      ExifImageWidth: 7728,
      ExifImageHeight: 5152,
      Orientation: 1,
      ColorSpace: 1,
      Software: 'Capture One',
      latitude: 48.1486,
      longitude: 17.1077,
    })

    expect(meta).toMatchObject({
      make: 'Fujifilm',
      model: 'X-T5',
      lens: 'XF33mmF1.4 R LM WR',
      fNumber: 1.4,
      exposureTime: '1/500 s',
      iso: 200,
      focalLengthMm: 33,
      width: 7728,
      height: 5152,
      orientation: 1,
      colorSpace: 'sRGB',
      software: 'Capture One',
      gps: { lat: 48.1486, lng: 17.1077 },
    })
    expect(meta?.takenAt).toBe('2024-06-15T14:30:00.000Z')
  })

  it('returns null for empty / useless payloads', async () => {
    const { normalizeImageFileMeta } = await import('#/lib/image-file-meta')
    expect(normalizeImageFileMeta(null)).toBeNull()
    expect(normalizeImageFileMeta({})).toBeNull()
    expect(normalizeImageFileMeta({ Make: '   ' })).toBeNull()
  })

  it('formats exposure >= 1s without reciprocal', async () => {
    const { normalizeImageFileMeta } = await import('#/lib/image-file-meta')
    expect(
      normalizeImageFileMeta({ ExposureTime: 2 })?.exposureTime,
    ).toBe('2 s')
    expect(
      normalizeImageFileMeta({ ExposureTime: 1.5 })?.exposureTime,
    ).toBe('1.5 s')
  })

  it('formatImageFileMetaRows builds Slovak UI rows', async () => {
    const { formatImageFileMetaRows, normalizeImageFileMeta } = await import(
      '#/lib/image-file-meta'
    )
    const meta = normalizeImageFileMeta({
      Make: 'Apple',
      Model: 'iPhone 15',
      DateTimeOriginal: new Date('2025-01-10T09:00:00Z'),
      FNumber: 1.8,
      ExposureTime: 1 / 120,
      ISO: 64,
      FocalLength: 6.9,
      latitude: 48.15,
      longitude: 17.11,
    })
    expect(meta).not.toBeNull()
    const rows = formatImageFileMetaRows(meta!)
    expect(rows.map((r) => r.label)).toEqual(
      expect.arrayContaining(['Aparát', 'Nasnímané', 'Expozícia', 'GPS']),
    )
    expect(rows.find((r) => r.label === 'Aparát')?.value).toBe('Apple iPhone 15')
    expect(rows.find((r) => r.label === 'Expozícia')?.value).toContain('f/1.8')
    expect(rows.find((r) => r.label === 'Expozícia')?.value).toContain('ISO 64')
  })

  it('readImageFileMeta wraps exifr and swallows errors', async () => {
    parseMock.mockResolvedValueOnce({
      Make: 'Canon',
      Model: 'EOS R6',
      ExposureTime: 1 / 250,
    })
    const { readImageFileMeta } = await import('#/lib/image-file-meta')
    await expect(readImageFileMeta('https://cdn.example/a.jpg')).resolves.toMatchObject({
      make: 'Canon',
      model: 'EOS R6',
      exposureTime: '1/250 s',
    })

    parseMock.mockRejectedValueOnce(new Error('boom'))
    await expect(readImageFileMeta('https://cdn.example/b.jpg')).resolves.toBeNull()
  })

  it('builds an OpenStreetMap deep link', async () => {
    const { imageFileMetaMapsUrl } = await import('#/lib/image-file-meta')
    expect(imageFileMetaMapsUrl({ lat: 48.1, lng: 17.2 })).toContain(
      'openstreetmap.org',
    )
    expect(imageFileMetaMapsUrl({ lat: 48.1, lng: 17.2 })).toContain('mlat=48.1')
  })
})
