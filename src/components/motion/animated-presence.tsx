import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { pageSwap } from '#/lib/motion'
import { cn } from '#/lib/utils'

type Props = {
  /** Unique key — when it changes, content cross-fades. */
  id: string | number
  children: ReactNode
  className?: string
  mode?: 'wait' | 'sync' | 'popLayout'
}

export function SwapPresence({
  id,
  children,
  className,
  mode = 'wait',
}: Props) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={id}
        className={cn(className)}
        variants={pageSwap}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
