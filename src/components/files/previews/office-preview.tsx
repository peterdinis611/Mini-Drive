import { ExternalLink, FileSpreadsheet, FileText } from 'lucide-react'

import { Button } from '#/components/ui/button'

import type { PreviewShellProps } from './types'

/** Microsoft Office Online embed for DOCX / XLSX / PPTX when URL is reachable. */
export function OfficePreview({
  url,
  fileName,
  mimeType,
}: PreviewShellProps) {
  const isSheet =
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    /\.xlsx?$/i.test(fileName)
  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          {isSheet ? (
            <FileSpreadsheet className="size-4" aria-hidden />
          ) : (
            <FileText className="size-4" aria-hidden />
          )}
          Office Online náhľad
        </p>
        <Button asChild size="sm" variant="outline">
          <a href={officeSrc} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
            Otvoriť
          </a>
        </Button>
      </div>
      <iframe
        title={fileName}
        src={officeSrc}
        className="min-h-[420px] w-full flex-1 rounded-xl border border-border bg-card"
        allow="fullscreen"
      />
      <p className="px-1 text-xs text-muted-foreground">
        Vyžaduje verejne dosiahnuteľný signed URL (UploadThing). Ak sa náhľad
        nenačíta, stiahni súbor lokálne.
      </p>
    </div>
  )
}
