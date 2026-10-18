import type { PreviewShellProps } from './types'

export function ImagePreview({ url, fileName }: PreviewShellProps) {
  return (
    <div className="relative flex h-[min(70vh,640px)] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%),linear-gradient(180deg,color-mix(in_oklab,var(--muted)_55%,transparent),transparent)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(45deg,#0000_25%,color-mix(in_oklab,var(--border)_70%,transparent)_25%,color-mix(in_oklab,var(--border)_70%,transparent)_50%,#0000_50%,#0000_75%,color-mix(in_oklab,var(--border)_70%,transparent)_75%)] [background-size:16px_16px]"
      />
      <img
        src={url}
        alt={fileName}
        className="relative z-10 max-h-full max-w-full rounded-lg object-contain shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] ring-1 ring-border/70"
      />
    </div>
  )
}
