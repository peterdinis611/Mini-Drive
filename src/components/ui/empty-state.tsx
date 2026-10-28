import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
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
      variants={reduce ? undefined : scaleIn}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className={cn('relative', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="status-page-grain absolute inset-0 opacity-40" />
      </div>

      <Empty className="relative z-10 border-0 bg-transparent py-16 sm:py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-14 rounded-2xl border-2 border-foreground/15 bg-primary/15 text-foreground dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
            <motion.span
              className="inline-flex"
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className="size-6" aria-hidden />
            </motion.span>
          </EmptyMedia>
          <EmptyTitle className="font-display text-2xl sm:text-3xl">
            {title}
          </EmptyTitle>
          <EmptyDescription className="max-w-sm leading-relaxed">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        {action ? (
          <EmptyContent>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...riseTransition, delay: 0.12 }}
              whileHover={reduce ? undefined : { y: -2 }}
            >
              {action}
            </motion.div>
          </EmptyContent>
        ) : null}
      </Empty>
    </motion.div>
  )
}
