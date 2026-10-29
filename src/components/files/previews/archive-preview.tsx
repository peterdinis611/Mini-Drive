import { Download, FileArchive } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { formatFileSize } from '#/lib/format'

import type { PreviewShellProps } from './types'

export function ArchivePreview({
  url,
  fileName,
  fileSize,
  mimeType,
}: PreviewShellProps) {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center gap-4 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--muted)_70%,transparent),transparent)] px-6 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-amber-600 shadow-sm dark:text-amber-400">
        <FileArchive className="size-7" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-medium text-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          Archív ({formatFileSize(fileSize)}
          {mimeType ? ` · ${mimeType}` : ''}) sa nedá zobraziť inline — stiahni
          a rozbaľ lokálne.
        </p>
      </div>
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noreferrer">
          <Download />
          Stiahnuť archív
        </a>
      </Button>
    </div>
  )
}
