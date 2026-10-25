import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { AtmosphereBackdrop } from '#/components/layout/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { APP_NAME } from '#/lib/constants'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

/** Lightweight auth layout — no motion.js, fast first paint. */
export function AuthShell({ children, className }: Props) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <AtmosphereBackdrop intensity="bold" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition hover:text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            M
          </span>
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 sm:px-8',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Placeholder while Clerk UI chunk loads. */
export function AuthCardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[400px] rounded-sm border border-[#2a3140] bg-[#161a22] p-8"
      aria-busy="true"
      aria-label="Načítavam prihlásenie"
    >
      <div className="mx-auto mb-2 h-6 w-48 animate-pulse rounded bg-[#2a3140]" />
      <div className="mx-auto mb-8 h-4 w-56 animate-pulse rounded bg-[#2a3140]/70" />
      <div className="mb-3 h-10 animate-pulse rounded bg-[#0e1014]" />
      <div className="mb-6 h-10 animate-pulse rounded bg-[#0e1014]" />
      <div className="mb-4 h-10 animate-pulse rounded bg-[#0e1014]" />
      <div className="h-10 animate-pulse rounded bg-[#22d3ee]/30" />
    </div>
  )
}
