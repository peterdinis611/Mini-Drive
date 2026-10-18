import { Link } from '@tanstack/react-router'
import { ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AtmosphereBackdrop } from '#/components/three/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import { APP_NAME } from '#/lib/constants'
import { fadeUp, riseTransition, scaleIn, staggerSlow } from '#/lib/motion'

type StatusPageProps = {
  code: '404' | '500'
  title: string
  description: string
  onRetry?: () => void
}

export function StatusPage({
  code,
  title,
  description,
  onRetry,
}: StatusPageProps) {
  const isNotFound = code === '404'
  const reduce = useReducedMotion()

  return (
    <div className="status-page relative flex min-h-svh flex-col overflow-hidden">
      <AtmosphereBackdrop intensity="bold" />

      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10"
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={riseTransition}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition hover:text-primary"
        >
          <motion.span
            className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
            whileHover={reduce ? undefined : { scale: 1.06, rotate: -3 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
          >
            M
          </motion.span>
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </motion.header>

      <motion.main
        className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-16 sm:px-10"
        variants={reduce ? undefined : staggerSlow}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <motion.p
          className="font-display text-[clamp(5.5rem,18vw,8.5rem)] leading-none text-primary/15 select-none"
          aria-hidden
          variants={reduce ? undefined : scaleIn}
        >
          {code}
        </motion.p>

        <motion.div
          className="-mt-6 space-y-3 sm:-mt-8"
          variants={reduce ? undefined : fadeUp}
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {isNotFound ? 'Stránka nenájdená' : 'Chyba servera'}
          </p>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          variants={reduce ? undefined : fadeUp}
        >
          <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
            <Button asChild>
              <Link to="/">
                <Home />
                Domov
              </Link>
            </Button>
          </motion.div>
          {onRetry ? (
            <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
              <Button type="button" variant="outline" onClick={onRetry}>
                <RefreshCw />
                Skúsiť znova
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
              <Button asChild variant="outline">
                <Link to="/files">
                  <ArrowLeft />
                  Späť do súborov
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.main>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Táto cesta nikam nevedie"
      description="Adresa neexistuje, bola presunutá alebo nemáš k nej prístup. Skontroluj URL alebo sa vráť do úložiska."
    />
  )
}

export function ServerErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const detail =
    import.meta.env.DEV && error.message
      ? error.message
      : 'Niečo sa pokazilo na našej strane. Skús obnoviť stránku o chvíľu.'

  return (
    <StatusPage
      code="500"
      title="Nepodarilo sa načítať"
      description={detail}
      onRetry={reset}
    />
  )
}

export function RoutePending() {
  const reduce = useReducedMotion()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="border-b border-border/80 px-6 py-5 sm:px-10">
        <motion.div
          className="h-8 w-36 rounded-md bg-muted"
          animate={
            reduce
              ? undefined
              : { opacity: [0.45, 0.85, 0.45] }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8 sm:px-8">
        {[48, 72, 'full', 'full', '4/5'].map((width, i) => (
          <motion.div
            key={i}
            className={
              width === 'full'
                ? 'h-12 rounded-md bg-muted/60'
                : width === '4/5'
                  ? 'h-12 w-4/5 rounded-md bg-muted/60'
                  : `h-10 rounded-md bg-muted ${width === 48 ? 'w-48' : 'w-72'}`
            }
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: [0.4, 0.75, 0.4], y: 0 }
            }
            transition={{
              opacity: { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 },
              y: { duration: 0.35, delay: i * 0.05 },
            }}
          />
        ))}
      </div>
    </div>
  )
}
