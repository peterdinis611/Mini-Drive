import { useEffect, useRef, useState } from 'react'
import { useThrottledCallback } from '@tanstack/react-pacer'
import { useRouterState } from '@tanstack/react-router'
import { ArrowUp } from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'

import { Button } from '#/components/ui/button'
import { easeOutExpo, springSnappy } from '#/lib/motion'
import { cn } from '#/lib/utils'

const SHOW_AFTER_PX = 280

type ScrollControls = {
  stop: () => void
}

function animateScrollToTop(preferReducedMotion: boolean): ScrollControls {
  if (preferReducedMotion) {
    window.scrollTo(0, 0)
    return { stop: () => undefined }
  }

  const from = window.scrollY
  if (from <= 0) return { stop: () => undefined }

  const controls = animate(from, 0, {
    duration: Math.min(0.85, 0.28 + from / 3500),
    ease: easeOutExpo as [number, number, number, number],
    onUpdate: (value) => {
      window.scrollTo(0, value)
    },
  })

  return { stop: () => controls.stop() }
}

/** Reset window scroll when the pathname changes (SPA navigation). */
export function ScrollToTopOnNavigate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduce = useReducedMotion()
  const controlsRef = useRef<ScrollControls | null>(null)

  useEffect(() => {
    controlsRef.current?.stop()
    controlsRef.current = animateScrollToTop(Boolean(reduce))
    return () => controlsRef.current?.stop()
  }, [pathname, reduce])

  return null
}

/** Floating control — Motion scroll-linked reveal + animated scroll. */
export function ScrollToTopButton({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const [visible, setVisible] = useState(false)
  const controlsRef = useRef<ScrollControls | null>(null)

  const updateVisibility = useThrottledCallback(
    (y: number) => {
      setVisible(y > SHOW_AFTER_PX)
    },
    { wait: 120 },
  )

  useMotionValueEvent(scrollY, 'change', (y) => {
    updateVisibility(y)
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    mass: 0.4,
  })
  const progressPct = useTransform(progress, (v) => `${Math.round(v * 100)}%`)
  const ringBackground = useMotionTemplate`conic-gradient(var(--primary) ${progressPct}, transparent 0)`

  function handleClick() {
    controlsRef.current?.stop()
    controlsRef.current = animateScrollToTop(Boolean(reduce))
  }

  useEffect(() => {
    return () => controlsRef.current?.stop()
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={cn(
            'fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6',
            className,
          )}
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduce
              ? undefined
              : { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.18 } }
          }
          transition={springSnappy}
        >
          <motion.div
            className="relative rounded-full p-[2px]"
            style={reduce ? undefined : { background: ringBackground }}
            whileHover={reduce ? undefined : { scale: 1.06 }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            transition={springSnappy}
          >
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Späť nahor"
              className="relative size-11 rounded-full border border-border/80 bg-card/95 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] backdrop-blur-md hover:bg-card"
              onClick={handleClick}
            >
              <motion.span
                className="inline-flex"
                initial={false}
                whileHover={reduce ? undefined : { y: -1 }}
                transition={springSnappy}
              >
                <ArrowUp className="size-4" />
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
