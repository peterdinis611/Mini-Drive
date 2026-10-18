import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

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
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Pripravujem PDF…
          </div>
        }
      >
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
