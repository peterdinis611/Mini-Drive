import { lazy, Suspense } from 'react'

import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import type { FileKind } from '#/lib/file-kind'

import { ArchivePreview } from './archive-preview'
import { AudioPreview } from './audio-preview'
import { FallbackPreview } from './fallback-preview'
import type { PreviewShellProps, ThemePreference } from './types'
import { VideoPreview } from './video-preview'

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
const XmlPreview = lazy(() =>
  import('./xml-preview').then((m) => ({ default: m.XmlPreview })),
)
const SpreadsheetPreview = lazy(() =>
  import('./spreadsheet-preview').then((m) => ({
    default: m.SpreadsheetPreview,
  })),
)
const OfficePreview = lazy(() =>
  import('./office-preview').then((m) => ({
    default: m.OfficePreview,
  })),
)

type Props = PreviewShellProps & {
  kind: FileKind
  theme: ThemePreference
}

function isXmlFile(mimeType: string, fileName: string) {
  return (
    mimeType === 'application/xml' ||
    mimeType === 'text/xml' ||
    mimeType.includes('+xml') ||
    /\.xml$/i.test(fileName)
  )
}

function PreviewFallback({ kind }: { kind: FileKind }) {
  const label =
    kind === 'pdf'
      ? 'Pripravujem PDF…'
      : kind === 'image'
        ? 'Pripravujem editor…'
        : kind === 'spreadsheet' || kind === 'office'
          ? 'Pripravujem tabuľku…'
          : 'Načítavam náhľad…'

  return <PreviewLoading label={label} />
}

export function FilePreviewBody({ kind, theme, ...shell }: Props) {
  const xml = isXmlFile(shell.mimeType, shell.fileName)

  let body
  if (xml) {
    body = <XmlPreview {...shell} />
  } else {
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
      case 'office':
        body = <OfficePreview {...shell} />
        break
      case 'archive':
        body = <ArchivePreview {...shell} />
        break
      default:
        body = <FallbackPreview {...shell} />
    }
  }

  const needsSuspense =
    xml ||
    kind === 'image' ||
    kind === 'pdf' ||
    kind === 'text' ||
    kind === 'code' ||
    kind === 'spreadsheet' ||
    kind === 'office'

  return (
    <AppErrorBoundary
      variant="section"
      name={`preview:${xml ? 'xml' : kind}`}
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
