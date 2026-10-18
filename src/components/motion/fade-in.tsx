import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { fadeUp, riseTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeIn({ children, className, delay = 0 }: Props) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ ...riseTransition, delay }}
    >
      {children}
    </motion.div>
  )
}
