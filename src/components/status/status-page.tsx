import { Link } from '@tanstack/react-router'
import { ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AtmosphereBackdrop } from '#/components/layout/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import { APP_NAME } from '#/lib/constants'
import {
  easeOutExpo,
  riseTransition,
  springSnappy,
} from '#/lib/motion'
import { cn } from '#/lib/utils'

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
  const digits = code.split('')

  return (
    <div
      className={cn(
        'status-page relative flex min-h-svh flex-col overflow-hidden',
        isNotFound ? 'status-page--404' : 'status-page--500',
      )}
    >
      <AtmosphereBackdrop intensity="bold" />
      <div className="status-page-scan" aria-hidden />
      <div className="status-page-rail" aria-hidden />

      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10"
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={riseTransition}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground transition hover:text-primary"
        >
          <motion.span
            className="flex size-8 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground"
            whileHover={reduce ? undefined : { scale: 1.06, rotate: -4 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={springSnappy}
          >
            M
          </motion.span>
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </motion.header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-20 sm:px-10">
        {/* One composition: brand-scale code + copy + CTAs */}
        <div className="relative">
          <motion.p
            className="mb-3 font-mono text-[11px] tracking-[0.28em] text-muted-foreground uppercase"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...riseTransition, delay: 0.05 }}
          >
            {isNotFound ? 'Fault · missing_path' : 'Fault · runtime'}
          </motion.p>

          <div
            className="flex items-baseline gap-1 sm:gap-2"
            aria-label={`HTTP ${code}`}
          >
            {digits.map((digit, i) => (
              <motion.span
                key={`${digit}-${i}`}
                className={cn(
                  'font-mono text-[clamp(6.5rem,28vw,11rem)] leading-[0.82] font-medium tracking-[-0.06em]',
                  isNotFound ? 'text-primary' : 'text-destructive',
                )}
                initial={
                  reduce ? false : { opacity: 0, y: 56, filter: 'blur(8px)' }
                }
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  ...springSnappy,
                  delay: 0.1 + i * 0.08,
                }}
              >
                {digit}
              </motion.span>
            ))}
          </div>

          {!reduce ? (
            <motion.div
              className={cn(
                'mt-2 h-px w-full origin-left',
                isNotFound ? 'bg-primary/50' : 'bg-destructive/50',
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.35 }}
              aria-hidden
            />
          ) : (
            <div
              className={cn(
                'mt-2 h-px w-full',
                isNotFound ? 'bg-primary/50' : 'bg-destructive/50',
              )}
              aria-hidden
            />
          )}
        </div>

        <motion.div
          className="mt-8 max-w-lg space-y-4"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...riseTransition, delay: 0.32 }}
        >
          <p
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase',
              isNotFound ? 'text-primary' : 'text-destructive',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                isNotFound ? 'bg-primary' : 'bg-destructive',
              )}
            />
            {isNotFound ? 'Stránka nenájdená' : 'Chyba servera'}
          </p>

          <h1 className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.08] font-semibold tracking-tight text-foreground">
            {title}
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            {description}
          </p>
        </motion.div>

        <motion.div
          className="mt-9 flex flex-wrap gap-3"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...riseTransition, delay: 0.42 }}
        >
          <motion.div
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={springSnappy}
          >
            <Button asChild size="lg" className="rounded-sm">
              <Link to="/">
                <Home />
                Domov
              </Link>
            </Button>
          </motion.div>

          {onRetry ? (
            <motion.div
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={springSnappy}
            >
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-sm"
                onClick={onRetry}
              >
                <RefreshCw />
                Skúsiť znova
              </Button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={springSnappy}
            >
              <Button asChild size="lg" variant="outline" className="rounded-sm">
                <Link to="/files">
                  <ArrowLeft />
                  Späť do súborov
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.p
          className="mt-10 font-mono text-[11px] tracking-wide text-muted-foreground/70"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...riseTransition, delay: 0.55 }}
        >
          {APP_NAME} · HTTP {code}
        </motion.p>
      </main>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Táto cesta v archíve nie je"
      description="Adresa neexistuje, bola presunutá alebo k nej nemáš prístup. Skontroluj URL, alebo sa vráť do úložiska."
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
      : 'Niečo sa pokazilo na našej strane. Skús obnoviť stránku o chvíľu — dáta sú v bezpečí.'

  return (
    <StatusPage
      code="500"
      title="Úložisko momentálne neodpovedá"
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
          className="h-8 w-36 rounded-sm bg-muted"
          animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8 sm:px-8">
        {[48, 72, 'full', 'full', '4/5'].map((width, i) => (
          <motion.div
            key={i}
            className={
              width === 'full'
                ? 'h-12 rounded-sm bg-muted/60'
                : width === '4/5'
                  ? 'h-12 w-4/5 rounded-sm bg-muted/60'
                  : `h-10 rounded-sm bg-muted ${width === 48 ? 'w-48' : 'w-72'}`
            }
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={
              reduce ? { opacity: 1 } : { opacity: [0.4, 0.75, 0.4], y: 0 }
            }
            transition={{
              opacity: {
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.08,
              },
              y: { duration: 0.35, delay: i * 0.05 },
            }}
          />
        ))}
      </div>
    </div>
  )
}
