import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
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
  let body
  switch (kind) {
    case 'image':
      body = <ImagePreview {...shell} />
      break
    case 'pdf':
      body = <PdfPreview {...shell} theme={theme} />
      break
    case 'video':
      body = <VideoPreview {...shell} />
      break
    case 'audio':
      body = <AudioPreview {...shell} />
      break
    case 'text':
      body = <TextPreview {...shell} />
      break
    case 'code':
      body = <CodePreview {...shell} />
      break
    case 'spreadsheet':
      body = <SpreadsheetPreview {...shell} />
      break
    case 'archive':
      body = <ArchivePreview {...shell} />
      break
    default:
      body = <FallbackPreview {...shell} />
  }

  return (
    <AppErrorBoundary
      variant="section"
      name={`preview:${kind}`}
      resetKeys={[kind, shell.fileId, shell.url]}
      sectionTitle="Náhľad tohto typu zlyhal"
      compact
    >
      {body}
    </AppErrorBoundary>
  )
}
