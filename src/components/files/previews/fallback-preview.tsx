import { Download, FileIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { formatFileSize } from '#/lib/format'

import type { PreviewShellProps } from './types'

export function FallbackPreview({
  url,
  fileName,
  mimeType,
  fileSize,
}: PreviewShellProps) {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground">
        <FileIcon className="size-7" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-medium text-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          Pre tento typ súboru ({mimeType || 'neznámy'} ·{' '}
          {formatFileSize(fileSize)}) nie je inline náhľad.
        </p>
      </div>
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noreferrer">
          <Download />
          Otvoriť / stiahnuť
        </a>
      </Button>
    </div>
  )
}
