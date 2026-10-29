import {
  CheckCircle2,
  Info,
  MessageSquare,
  OctagonAlert,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { riseTransition } from '#/lib/motion'
import type { ToastItem, ToastTone } from '#/lib/toast'
import { dismiss, subscribe } from '#/lib/toast'
import { cn } from '#/lib/utils'

const toneMeta: Record<
  ToastTone,
  { icon: typeof CheckCircle2; bar: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-primary',
    iconClass: 'text-primary',
  },
  error: {
    icon: OctagonAlert,
    bar: 'bg-destructive',
    iconClass: 'text-destructive',
  },
  info: {
    icon: Info,
    bar: 'bg-primary/70',
    iconClass: 'text-primary',
  },
  message: {
    icon: MessageSquare,
    bar: 'bg-muted-foreground/40',
    iconClass: 'text-muted-foreground',
  },
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  const reduce = useReducedMotion()

  useEffect(() => subscribe(setItems), [])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => {
          const meta = toneMeta[item.tone]
          const Icon = meta.icon
          return (
            <motion.div
              key={item.id}
              layout
              role="status"
              className="pointer-events-auto w-full max-w-[360px] overflow-hidden rounded-2xl border-2 border-foreground/15 bg-popover/95 text-popover-foreground shadow-none backdrop-blur-md dark:border-primary/35"
              initial={
                reduce ? false : { opacity: 0, y: -12, scale: 0.96, x: 12 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.97, x: 16 }
              }
              transition={riseTransition}
            >
              <div className="flex gap-3 p-3.5 pr-2">
                <span
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70',
                    meta.iconClass,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  {item.action ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      onClick={() => {
                        item.action?.onClick()
                        dismiss(item.id)
                      }}
                    >
                      {item.action.label}
                    </button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-muted-foreground"
                  aria-label="Zavrieť"
                  onClick={() => dismiss(item.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
              <div className="h-0.5 w-full bg-muted">
                {item.duration > 0 && !reduce ? (
                  <motion.div
                    className={cn('h-full origin-left', meta.bar)}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{
                      duration: item.duration / 1000,
                      ease: 'linear',
                    }}
                  />
                ) : (
                  <div className={cn('h-full w-full', meta.bar)} />
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
