import type { FileKind } from '#/lib/file-kind'

import { ArchivePreview } from './archive-preview'
import { AudioPreview } from './audio-preview'
import { CodePreview } from './code-preview'
import { FallbackPreview } from './fallback-preview'
import { ImagePreview } from './image-preview'
import { PdfPreview } from './pdf-preview'
import { SpreadsheetPreview } from './spreadsheet-preview'
import { TextPreview } from './text-preview'
import { VideoPreview } from './video-preview'
import type { PreviewShellProps, ThemePreference } from './types'

type Props = PreviewShellProps & {
  kind: FileKind
  theme: ThemePreference
}

export function FilePreviewBody({ kind, theme, ...shell }: Props) {
  switch (kind) {
    case 'image':
      return <ImagePreview {...shell} />
    case 'pdf':
      return <PdfPreview {...shell} theme={theme} />
    case 'video':
      return <VideoPreview {...shell} />
    case 'audio':
      return <AudioPreview {...shell} />
    case 'text':
      return <TextPreview {...shell} />
    case 'code':
      return <CodePreview {...shell} />
    case 'spreadsheet':
      return <SpreadsheetPreview {...shell} />
    case 'archive':
      return <ArchivePreview {...shell} />
    default:
      return <FallbackPreview {...shell} />
  }
}
