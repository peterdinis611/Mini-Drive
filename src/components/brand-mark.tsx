import { Link } from '@tanstack/react-router'

import { APP_NAME } from '#/lib/constants'
import { cn } from '#/lib/utils'

type Props = {
  to?: '/' | '/files'
  className?: string
  /** Compact mark for sidebar / tight chrome */
  compact?: boolean
  onClick?: () => void
}

export function BrandMark({
  to = '/',
  className,
  compact = false,
  onClick,
}: Props) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 items-center gap-2 text-foreground transition hover:opacity-80',
        className,
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground',
          compact ? 'size-7 text-[11px]' : 'size-8 text-xs',
        )}
      >
        M
      </span>
      <span
        className={cn(
          'font-script leading-none tracking-tight',
          compact ? 'truncate text-[1.35rem]' : 'text-[1.65rem]',
        )}
      >
        {APP_NAME}
      </span>
    </Link>
  )
}
