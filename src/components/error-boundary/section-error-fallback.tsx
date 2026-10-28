import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { getErrorMessage } from '#/lib/errors'
import { cn } from '#/lib/utils'

type Props = {
  error: unknown
  resetErrorBoundary: () => void
  title?: string
  className?: string
  compact?: boolean
}

/** Inline recovery UI for nested islands (preview, panels). */
export function SectionErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Táto časť zlyhala',
  className,
  compact = false,
}: Props) {
  const message = getErrorMessage(
    error,
    'Skús to znova. Ostatok aplikácie by mal fungovať ďalej.',
  )

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-destructive/25 bg-destructive/5 text-center',
        compact ? 'px-4 py-8' : 'min-h-[240px] px-6 py-12',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <p className="font-display text-lg">{title}</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <Button type="button" variant="outline" onClick={resetErrorBoundary}>
        <RefreshCw />
        Skúsiť znova
      </Button>
    </div>
  )
}
