import type { LucideIcon } from 'lucide-react'
import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from 'lucide-react'

export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'code'
  | 'spreadsheet'
  | 'office'
  | 'archive'
  | 'file'

const CODE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|less|html?|json|xml|yml|yaml|toml|py|rs|go|java|kt|swift|c|cpp|h|hpp|cs|php|rb|sh|bash|zsh|sql|graphql|vue|svelte)$/i

const SPREADSHEET_EXT = /\.(csv|tsv)$/i
const OFFICE_SHEET_EXT = /\.xlsx?$/i
const OFFICE_DOC_EXT = /\.(docx?|pptx?|odt|ods)$/i
const ARCHIVE_EXT = /\.(zip|rar|7z|tar|gz|tgz|bz2)$/i
const TEXT_EXT = /\.(txt|md|markdown|log|rtf)$/i

export function getFileKind(mimeType: string, name = ''): FileKind {
  if (
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name)
  ) {
    return 'image'
  }
  if (mimeType.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(name)) {
    return 'video'
  }
  if (
    mimeType.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name)
  ) {
    return 'audio'
  }
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(name)) {
    return 'pdf'
  }
  if (
    mimeType.includes('officedocument') ||
    mimeType.includes('msword') ||
    mimeType.includes('ms-powerpoint') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('opendocument') ||
    OFFICE_DOC_EXT.test(name) ||
    OFFICE_SHEET_EXT.test(name)
  ) {
    return 'office'
  }
  if (mimeType === 'text/csv' || SPREADSHEET_EXT.test(name)) {
    return 'spreadsheet'
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar') ||
    ARCHIVE_EXT.test(name)
  ) {
    return 'archive'
  }
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    CODE_EXT.test(name)
  ) {
    return 'code'
  }
  if (mimeType.startsWith('text/') || TEXT_EXT.test(name)) {
    return 'text'
  }
  return 'file'
}

export function fileKindIcon(kind: FileKind): LucideIcon {
  switch (kind) {
    case 'image':
      return FileImage
    case 'video':
      return FileVideo
    case 'audio':
      return FileAudio
    case 'pdf':
      return FileText
    case 'text':
      return FileText
    case 'code':
      return FileCode2
    case 'spreadsheet':
      return FileSpreadsheet
    case 'office':
      return FileText
    case 'archive':
      return FileArchive
    default:
      return FileIcon
  }
}

export function fileKindLabel(kind: FileKind): string {
  switch (kind) {
    case 'image':
      return 'Obrázok'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'pdf':
      return 'PDF'
    case 'text':
      return 'Text'
    case 'code':
      return 'Kód'
    case 'spreadsheet':
      return 'Tabuľka'
    case 'office':
      return 'Office'
    case 'archive':
      return 'Archív'
    default:
      return 'Súbor'
  }
}

export function canInlinePreview(kind: FileKind): boolean {
  return (
    kind === 'image' ||
    kind === 'pdf' ||
    kind === 'video' ||
    kind === 'audio' ||
    kind === 'text' ||
    kind === 'code' ||
    kind === 'spreadsheet' ||
    kind === 'office'
  )
}

export function codeLanguageFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TSX',
    js: 'JavaScript',
    jsx: 'JSX',
    mjs: 'JavaScript',
    cjs: 'JavaScript',
    json: 'JSON',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML',
    htm: 'HTML',
    md: 'Markdown',
    py: 'Python',
    rs: 'Rust',
    go: 'Go',
    java: 'Java',
    sql: 'SQL',
    sh: 'Shell',
    yml: 'YAML',
    yaml: 'YAML',
    xml: 'XML',
    toml: 'TOML',
  }
  return map[ext] ?? (ext.toUpperCase() || 'Code')
}
