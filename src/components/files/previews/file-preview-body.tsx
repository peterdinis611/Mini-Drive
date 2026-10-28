import { lazy, Suspense } from 'react'

import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import type { FileKind } from '#/lib/file-kind'

import { ArchivePreview } from './archive-preview'
import { AudioPreview } from './audio-preview'
import { FallbackPreview } from './fallback-preview'
import { VideoPreview } from './video-preview'
import type { PreviewShellProps, ThemePreference } from './types'

const ImagePreview = lazy(() =>
  import('./image-preview').then((m) => ({ default: m.ImagePreview })),
)
const PdfPreview = lazy(() =>
  import('./pdf-preview').then((m) => ({ default: m.PdfPreview })),
)
const TextPreview = lazy(() =>
  import('./text-preview').then((m) => ({ default: m.TextPreview })),
)
const CodePreview = lazy(() =>
  import('./code-preview').then((m) => ({ default: m.CodePreview })),
)
const SpreadsheetPreview = lazy(() =>
  import('./spreadsheet-preview').then((m) => ({
    default: m.SpreadsheetPreview,
  })),
)

type Props = PreviewShellProps & {
  kind: FileKind
  theme: ThemePreference
}

function PreviewFallback({ kind }: { kind: FileKind }) {
  const label =
    kind === 'pdf'
      ? 'Pripravujem PDF…'
      : kind === 'image'
        ? 'Pripravujem editor…'
        : kind === 'spreadsheet'
          ? 'Pripravujem tabuľku…'
          : 'Načítavam náhľad…'

  return <PreviewLoading label={label} />
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

  const needsSuspense =
    kind === 'image' ||
    kind === 'pdf' ||
    kind === 'text' ||
    kind === 'code' ||
    kind === 'spreadsheet'

  return (
    <AppErrorBoundary
      variant="section"
      name={`preview:${kind}`}
      resetKeys={[kind, shell.fileId, shell.url]}
      sectionTitle="Náhľad tohto typu zlyhal"
      compact
    >
      {needsSuspense ? (
        <Suspense fallback={<PreviewFallback kind={kind} />}>{body}</Suspense>
      ) : (
        body
      )}
    </AppErrorBoundary>
  )
}
