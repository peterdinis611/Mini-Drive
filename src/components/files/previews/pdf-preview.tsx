'use client'

import { EmbedPdfViewer } from './embed-pdf-viewer'
import type { PreviewShellProps, ThemePreference } from './types'

type Props = PreviewShellProps & {
  theme: ThemePreference
}

export function PdfPreview({ url, fileName, theme }: Props) {
  return <EmbedPdfViewer url={url} fileName={fileName} theme={theme} />
}
