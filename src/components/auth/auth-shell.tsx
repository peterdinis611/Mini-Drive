import type { ReactNode } from 'react'

import { BrandMark } from '#/components/brand-mark'
import { AtmosphereBackdrop } from '#/components/layout/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

/** Lightweight auth layout — no motion.js, fast first paint. */
export function AuthShell({ children, className }: Props) {
  return (
    <div className="app-frame">
      <div className="app-frame-inner relative flex min-h-[inherit] flex-col overflow-hidden">
        <AtmosphereBackdrop intensity="bold" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
          <BrandMark />
          <ThemeToggle />
        </header>

        <main
          id="main-content"
          className={cn(
            'relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 sm:px-8',
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

/** Placeholder while Clerk UI chunk loads. */
export function AuthCardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[400px] rounded-2xl border-2 border-border bg-card p-8 shadow-sm"
      aria-busy="true"
      aria-label="Načítavam prihlásenie"
    >
      <div className="mx-auto mb-2 h-6 w-48 animate-pulse rounded-full bg-muted" />
      <div className="mx-auto mb-8 h-4 w-56 animate-pulse rounded-full bg-muted/70" />
      <div className="mb-3 h-10 animate-pulse rounded-xl bg-muted" />
      <div className="mb-6 h-10 animate-pulse rounded-xl bg-muted" />
      <div className="mb-4 h-10 animate-pulse rounded-xl bg-muted" />
      <div className="h-10 animate-pulse rounded-full bg-primary/45" />
    </div>
  )
}
