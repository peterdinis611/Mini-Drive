'use client'

import { motion, useReducedMotion } from 'motion/react'

import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/utils'

type SpinnerProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZE = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
} as const

/** Compact spinner for buttons / inline chrome. */
export function InlineSpinner({
  className,
  size = 'sm',
}: Omit<SpinnerProps, 'label'>) {
  return (
    <Spinner
      className={cn('text-current', SIZE[size], className)}
      aria-hidden
    />
  )
}

/** Centered preload block for sections, dialogs, and lazy islands. */
export function PreloadSpinner({
  className,
  size = 'md',
  label = 'Načítavam…',
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-sm text-muted-foreground',
        className,
      )}
    >
      <Spinner className={cn('text-foreground/70', SIZE[size])} aria-hidden />
      <span>{label}</span>
    </div>
  )
}

/** Soft pulsing bars — used under route pending / empty main. */
export function SectionLoading({
  className,
  label = 'Načítavam obsah…',
}: {
  className?: string
  label?: string
}) {
  const reduce = useReducedMotion()

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('space-y-4 py-2', className)}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <InlineSpinner />
        <span>{label}</span>
      </div>
      <div className="space-y-3">
        {[1, 0.85, 1, 0.7].map((scale, i) => (
          <motion.div
            key={i}
            className="h-11 rounded-2xl bg-muted/70"
            style={{ width: `${scale * 100}%` }}
            animate={reduce ? undefined : { opacity: [0.4, 0.75, 0.4] }}
            transition={{
              duration: 1.35,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.08,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Preview dialog / media island fallback. */
export function PreviewLoading({
  className,
  label = 'Načítavam náhľad…',
}: {
  className?: string
  label?: string
}) {
  return (
    <PreloadSpinner
      className={cn('h-[420px] min-h-[240px]', className)}
      size="lg"
      label={label}
    />
  )
}

/** App-shell shaped pending (sidebar + main). */
export function AppShellPending({
  label = 'Načítavam Drive…',
}: {
  label?: string
}) {
  const reduce = useReducedMotion()

  return (
    <div
      className="app-frame"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-frame-inner flex min-h-[inherit] bg-background">
        <aside className="hidden w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar p-3 lg:block">
          <motion.div
            className="mb-4 h-8 w-28 rounded-full bg-sidebar-accent"
            animate={reduce ? undefined : { opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-7 rounded-full bg-sidebar-accent/70"
                animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.06,
                }}
              />
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border/80 px-4 py-4 sm:px-8">
            <motion.div
              className="h-8 w-40 rounded-full bg-muted"
              animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
            <SectionLoading label={label} />
          </div>
        </div>
      </div>
    </div>
  )
}
