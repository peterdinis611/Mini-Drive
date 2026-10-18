import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import type { EmptySceneKind } from '#/components/three/empty-scene'
import { riseTransition, scaleIn } from '#/lib/motion'
import { supportsWebGL } from '#/lib/webgl'
import { cn } from '#/lib/utils'

const EmptyScene = lazy(() =>
  import('#/components/three/empty-scene').then((mod) => ({
    default: mod.EmptyScene,
  })),
)

type Props = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
  /** Optional Three.js vignette instead of the static icon. */
  scene?: EmptySceneKind
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  scene,
}: Props) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const webglOk = mounted && !reduce && supportsWebGL()
  const showScene = Boolean(scene && webglOk)

  return (
    <motion.div
      className={cn(
        'relative flex flex-col items-center gap-5 overflow-hidden px-6 py-16 text-center sm:py-20',
        className,
      )}
      variants={reduce ? undefined : scaleIn}
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="status-page-grain absolute inset-0 opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        {showScene && scene ? (
          <motion.div
            className="relative size-36 sm:size-40"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={riseTransition}
          >
            <Suspense
              fallback={
                <span className="flex size-full items-center justify-center rounded-2xl border border-border bg-muted/50 text-primary">
                  <Icon className="size-7" aria-hidden />
                </span>
              }
            >
              <EmptyScene kind={scene} className="size-full" />
            </Suspense>
          </motion.div>
        ) : (
          <motion.span
            className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/60 text-primary shadow-sm"
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="size-6" aria-hidden />
          </motion.span>
        )}

        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {action ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...riseTransition, delay: 0.12 }}
            whileHover={reduce ? undefined : { y: -2 }}
          >
            {action}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}
