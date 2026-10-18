import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { riseTransition, scaleIn } from '#/lib/motion'
import { cn } from '#/lib/utils'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center gap-4 px-6 py-16 text-center',
        className,
      )}
      variants={reduce ? undefined : scaleIn}
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      <motion.span
        className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/60 text-primary shadow-sm"
        animate={
          reduce
            ? undefined
            : { y: [0, -4, 0] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="size-6" aria-hidden />
      </motion.span>
      <div className="space-y-2">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...riseTransition, delay: 0.12 }}
        >
          {action}
        </motion.div>
      ) : null}
    </motion.div>
  )
}
