import { Headphones } from 'lucide-react'

import { formatFileSize } from '#/lib/format'

import type { PreviewShellProps } from './types'

export function AudioPreview({
  url,
  fileName,
  mimeType,
  fileSize,
}: PreviewShellProps) {
  return (
    <div className="flex h-[420px] items-center justify-center bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_65%)] p-8">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="mb-5 flex items-start gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)} · {mimeType || 'audio'}
            </p>
          </div>
        </div>
        <div
          aria-hidden
          className="mb-5 flex h-10 items-end gap-0.5 opacity-70"
        >
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-primary/70"
              style={{
                height: `${18 + ((i * 17) % 55)}%`,
                opacity: 0.35 + ((i * 13) % 50) / 100,
              }}
            />
          ))}
        </div>
        <audio src={url} controls className="w-full" />
      </div>
    </div>
  )
}
