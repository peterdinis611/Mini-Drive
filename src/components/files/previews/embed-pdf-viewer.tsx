'use client'

import { lazy, Suspense, useMemo } from 'react'
import type { PDFViewerConfig } from '@embedpdf/react-pdf-viewer'

import { PreviewLoading } from '#/components/ui/preload-spinner'
import { cn } from '#/lib/utils'

import type { ThemePreference } from './types'

const PDFViewer = lazy(() =>
  import('@embedpdf/react-pdf-viewer').then((mod) => ({
    default: mod.PDFViewer,
  })),
)

type Props = {
  url: string
  /** Kept for a11y / future document title hooks. */
  fileName?: string
  theme?: ThemePreference | 'system'
  className?: string
  /** Compact chrome for public /e embed pages. */
  embedMode?: boolean
}

/** Shared EmbedPDF drop-in viewer for Drive preview + public embed. */
export function EmbedPdfViewer({
  url,
  fileName,
  theme = 'system',
  className,
  embedMode = false,
}: Props) {
  const config = useMemo((): PDFViewerConfig => {
    const disabledCategories = embedMode
      ? ['annotation', 'redaction', 'form', 'export']
      : ['annotation', 'redaction', 'form']

    return {
      src: url,
      theme: {
        preference: theme,
        light: {
          accent: {
            primary: '#2f6fed',
          },
        },
        dark: {
          accent: {
            primary: '#5b8ef5',
          },
        },
      },
      tabBar: 'never',
      disabledCategories,
    }
  }, [url, theme, embedMode])

  return (
    <div
      className={cn(
        'w-full overflow-hidden bg-background',
        embedMode
          ? 'h-full min-h-0'
          : 'h-[min(70vh,640px)] rounded-xl border border-border',
        className,
      )}
      data-file-name={fileName}
    >
      <Suspense
        fallback={
          <PreviewLoading
            className="h-full min-h-[320px]"
            label="Načítavam EmbedPDF…"
          />
        }
      >
        <PDFViewer
          key={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          config={config}
        />
      </Suspense>
    </div>
  )
}
