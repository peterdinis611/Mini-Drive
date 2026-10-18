import {
  FileAudio,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type FileKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'file'

export function getFileKind(mimeType: string, name = ''): FileKind {
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) {
    return 'image'
  }
  if (mimeType.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(name)) {
    return 'video'
  }
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) {
    return 'audio'
  }
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(name)) {
    return 'pdf'
  }
  if (
    mimeType.startsWith('text/') ||
    /\.(txt|md|csv|json|ts|tsx|js|jsx)$/i.test(name)
  ) {
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
    case 'text':
      return FileText
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
    default:
      return 'Súbor'
  }
}
