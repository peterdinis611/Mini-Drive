import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { BrandMark } from '#/components/brand-mark'
import { AtmosphereBackdrop } from '#/components/layout/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
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
    <div className="app-frame">
      <div className="app-frame-inner relative flex min-h-[inherit] flex-col overflow-hidden">
        <AtmosphereBackdrop intensity={intensity} />

        {showHeader ? (
          <motion.header
            className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={riseTransition}
          >
            <BrandMark />
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
    </div>
  )
}
