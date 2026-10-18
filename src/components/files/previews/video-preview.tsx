import { Film } from 'lucide-react'

import type { PreviewShellProps } from './types'

export function VideoPreview({ url, fileName }: PreviewShellProps) {
  return (
    <div className="flex h-[min(70vh,640px)] flex-col bg-[#0b0f14]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <Film className="size-3.5 text-[var(--primary)]" />
        <span className="truncate">{fileName}</span>
      </div>
      <div className="flex flex-1 items-center justify-center p-3">
        <video
          src={url}
          controls
          playsInline
          className="max-h-full max-w-full rounded-md bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        />
      </div>
    </div>
  )
}
