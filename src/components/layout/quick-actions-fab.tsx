'use client'

import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Clock3,
  FolderPlus,
  Link2,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Button } from '#/components/ui/button'
import { springSnappy } from '#/lib/motion'
import { dispatchQuickAction, queueQuickAction } from '#/lib/quick-actions'
import { cn } from '#/lib/utils'

type FabAction = {
  id: string
  label: string
  icon: typeof Upload
  shortcut?: string
  onSelect: () => void
}

export function QuickActionsFab() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  const onFiles =
    pathname === '/files' || pathname.startsWith('/files/')

  const actions: FabAction[] = [
    {
      id: 'search',
      label: 'Hľadať',
      icon: Search,
      shortcut: '⌘K',
      onSelect: () => dispatchQuickAction('search'),
    },
    {
      id: 'upload',
      label: 'Nahrať súbory',
      icon: Upload,
      onSelect: () => {
        if (onFiles) {
          dispatchQuickAction('upload')
          return
        }
        queueQuickAction('upload')
        void navigate({ to: '/files' })
      },
    },
    {
      id: 'create-folder',
      label: 'Nový priečinok',
      icon: FolderPlus,
      onSelect: () => {
        if (onFiles) {
          dispatchQuickAction('create-folder')
          return
        }
        queueQuickAction('create-folder')
        void navigate({ to: '/files' })
      },
    },
  ]

  const links = [
    { to: '/recent' as const, label: 'Nedávne', icon: Clock3 },
    { to: '/shares' as const, label: 'Zdieľania', icon: Link2 },
    { to: '/trash' as const, label: 'Kôš', icon: Trash2 },
    { to: '/settings' as const, label: 'Nastavenia', icon: Settings2 },
  ]

  function run(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="quick-actions-panel"
            role="menu"
            aria-label="Rýchle akcie"
            className="pointer-events-auto flex w-[min(100vw-2rem,17.5rem)] flex-col gap-1 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduce
                ? undefined
                : { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.16 } }
            }
            transition={springSnappy}
          >
            <p className="px-2 pt-1 pb-1.5 font-meta text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Rýchle akcie
            </p>

            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                initial={reduce ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSnappy, delay: index * 0.03 }}
                onClick={() => run(action.onSelect)}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
                  <action.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 font-medium">{action.label}</span>
                {action.shortcut ? (
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                ) : null}
              </motion.button>
            ))}

            <div
              className="my-1 h-px bg-border/80"
              role="separator"
              aria-hidden
            />

            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition hover:bg-accent hover:text-accent-foreground',
                  pathname.startsWith(item.to) &&
                    'bg-accent/70 font-medium text-foreground',
                )}
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="pointer-events-auto"
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        transition={springSnappy}
      >
        <Button
          type="button"
          size="icon"
          aria-label={open ? 'Zavrieť rýchle akcie' : 'Rýchle akcie'}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            'size-12 rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-[0_16px_40px_-14px_color-mix(in_oklab,var(--primary)_70%,transparent)]',
            'hover:bg-primary/90',
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <motion.span
            className="inline-flex"
            animate={{ rotate: open ? 45 : 0 }}
            transition={springSnappy}
          >
            <Plus className="size-5" aria-hidden />
          </motion.span>
        </Button>
      </motion.div>
    </div>
  )
}
