import { cn } from '#/lib/utils'

type Props = {
  intensity?: 'soft' | 'bold'
  className?: string
}

/** CSS-only atmosphere (no WebGL). */
export function AtmosphereBackdrop({ intensity = 'soft', className }: Props) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'status-page-mesh absolute inset-0',
          intensity === 'bold' && 'opacity-100',
          intensity === 'soft' && 'opacity-70',
        )}
      />
      <div className="status-page-grain absolute inset-0" />
    </div>
  )
}
