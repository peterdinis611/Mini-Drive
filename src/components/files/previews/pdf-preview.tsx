import { lazy, Suspense } from 'react'

import { PreviewLoading } from '#/components/ui/preload-spinner'

import type { PreviewShellProps, ThemePreference } from './types'

const PDFViewer = lazy(() =>
  import('@embedpdf/react-pdf-viewer').then((mod) => ({
    default: mod.PDFViewer,
  })),
)

type Props = PreviewShellProps & {
  theme: ThemePreference
}

export function PdfPreview({ url, theme }: Props) {
  return (
    <div className="h-[min(70vh,640px)] w-full bg-background">
      <Suspense fallback={<PreviewLoading className="h-full" label="Pripravujem PDF…" />}>
        <PDFViewer
          style={{ width: '100%', height: '100%' }}
          config={{
            src: url,
            theme: {
              preference: theme,
            },
            tabBar: 'never',
            disabledCategories: ['annotation', 'redaction', 'form'],
          }}
        />
      </Suspense>
    </div>
  )
}
