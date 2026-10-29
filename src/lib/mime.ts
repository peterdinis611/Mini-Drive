import {
  canInlinePreview as canPreviewKind,
  getFileKind,
} from '#/lib/file-kind'

/** Expand UploadThing shorthand / empty types into a real MIME string. */
export function resolveStoredMimeType(type: string, name: string): string {
  if (type.includes('/')) return type

  const kind = getFileKind(type, name)
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (kind === 'pdf') return 'application/pdf'
  if (kind === 'image') {
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      avif: 'image/avif',
      bmp: 'image/bmp',
    }
    return map[ext] ?? 'image/jpeg'
  }
  if (kind === 'video') {
    const map: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
    }
    return map[ext] ?? 'video/mp4'
  }
  if (kind === 'audio') {
    const map: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
      aac: 'audio/aac',
    }
    return map[ext] ?? 'audio/mpeg'
  }
  if (kind === 'spreadsheet' || kind === 'office') {
    const map: Record<string, string> = {
      csv: 'text/csv',
      tsv: 'text/tab-separated-values',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ods: 'application/vnd.oasis.opendocument.spreadsheet',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      odt: 'application/vnd.oasis.opendocument.text',
    }
    return (
      map[ext] ??
      (kind === 'spreadsheet' ? 'text/csv' : 'application/octet-stream')
    )
  }
  if (kind === 'archive') {
    const map: Record<string, string> = {
      zip: 'application/zip',
      rar: 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      tgz: 'application/gzip',
    }
    return map[ext] ?? 'application/zip'
  }
  if (kind === 'code') {
    const map: Record<string, string> = {
      json: 'application/json',
      js: 'text/javascript',
      mjs: 'text/javascript',
      ts: 'text/plain',
      tsx: 'text/plain',
      jsx: 'text/plain',
      css: 'text/css',
      html: 'text/html',
      xml: 'application/xml',
    }
    return map[ext] ?? 'text/plain'
  }
  if (kind === 'text') {
    const map: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      markdown: 'text/markdown',
      log: 'text/plain',
    }
    return map[ext] ?? 'text/plain'
  }

  return type || 'application/octet-stream'
}

export function isImageMimeType(mimeType: string, name = ''): boolean {
  return getFileKind(mimeType, name) === 'image'
}

export function isPdfMimeType(mimeType: string, name = ''): boolean {
  return getFileKind(mimeType, name) === 'pdf'
}

export function canInlinePreview(mimeType: string, name = ''): boolean {
  return canPreviewKind(getFileKind(mimeType, name))
}
