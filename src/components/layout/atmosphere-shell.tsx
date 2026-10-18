import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'

import { AtmosphereBackdrop } from '#/components/three/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { APP_NAME } from '#/lib/constants'
import { riseTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  /** Wider content for onboarding */
  wide?: boolean
  showHeader?: boolean
  intensity?: 'soft' | 'bold'
  className?: string
  headerRight?: ReactNode
}

export function AtmosphereShell({
  children,
  wide = false,
  showHeader = true,
  intensity = 'soft',
  className,
  headerRight,
}: Props) {
  const reduce = useReducedMotion()

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <AtmosphereBackdrop intensity={intensity} />

      {showHeader ? (
        <motion.header
          className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={riseTransition}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition hover:text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              M
            </span>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            {headerRight}
            <ThemeToggle />
          </div>
        </motion.header>
      ) : null}

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full flex-1 flex-col px-4 pb-12 sm:px-8',
          wide ? 'max-w-2xl' : 'max-w-md',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
