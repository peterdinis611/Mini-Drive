import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { listItem, staggerFast, staggerSlow } from '#/lib/motion'
import { cn } from '#/lib/utils'

type StaggerProps = {
  children: ReactNode
  className?: string
  slow?: boolean
}

export function Stagger({ children, className, slow = false }: StaggerProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      variants={slow ? staggerSlow : staggerFast}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={cn(className)} variants={listItem}>
      {children}
    </motion.div>
  )
}
