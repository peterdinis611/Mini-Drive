import { useClerk } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  Clock3,
  FileText,
  Link2,
  LogOut,
  PanelLeftClose,
  Settings2,
  Trash2,
} from 'lucide-react'

import { BrandMark } from '#/components/brand-mark'
import type { FolderTreeNode } from '#/components/files/types'
import { FavoritesNav } from '#/components/layout/favorites-nav'
import { FolderTree } from '#/components/layout/folder-tree'
import { ThemeToggle } from '#/components/theme-toggle'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '#/components/ui/hover-card'
import { Progress } from '#/components/ui/progress'
import { formatFileSize } from '#/lib/format'
import { cn } from '#/lib/utils'

export type DriveStats = {
  fileCount: number
  folderCount: number
  totalBytes: number
  quotaBytes: number
}

type Props = {
  userName: string
  userEmail?: string
  folders: FolderTreeNode[]
  activeFolderId: string | null
  stats: DriveStats
  onNavigate?: () => void
  onCollapse?: () => void
  className?: string
}

const NAV = [
  { to: '/files' as const, label: 'Súbory', icon: FileText, match: 'files' },
  { to: '/recent' as const, label: 'Nedávne', icon: Clock3, match: 'recent' },
  {
    to: '/activity' as const,
    label: 'Aktivita',
    icon: Activity,
    match: 'activity',
  },
  { to: '/shares' as const, label: 'Zdieľania', icon: Link2, match: 'shares' },
  { to: '/trash' as const, label: 'Kôš', icon: Trash2, match: 'trash' },
  {
    to: '/settings' as const,
    label: 'Nastavenia',
    icon: Settings2,
    match: 'settings',
  },
]

export function AppSidebar({
  userName,
  userEmail,
  folders,
  activeFolderId,
  stats,
  onNavigate,
  onCollapse,
  className,
}: Props) {
  const { signOut } = useClerk()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const usedPct = Math.min(
    100,
    Math.round((stats.totalBytes / Math.max(stats.quotaBytes, 1)) * 100),
  )
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-full w-full min-w-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
      aria-label="Bočný panel Drive"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-3">
        <BrandMark
          to="/files"
          compact
          onClick={onNavigate}
          className="min-w-0 rounded-xl px-1.5 py-1 hover:bg-sidebar-accent"
        />
        <menu className="m-0 flex list-none items-center p-0">
          <li>
            <ThemeToggle />
          </li>
          {onCollapse ? (
            <li>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="hidden size-8 lg:inline-flex"
                aria-label="Skryť sidebar"
                onClick={onCollapse}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </li>
          ) : null}
        </menu>
      </header>

      <nav className="px-2" aria-label="Hlavná navigácia">
        <ul className="m-0 list-none space-y-0.5 p-0">
          {NAV.map((item) => {
            const active =
              item.match === 'files'
                ? pathname === '/files' || pathname.startsWith('/files/')
                : pathname.startsWith(item.to)
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
                    active
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
                  )}
                >
                  <item.icon className="size-4 opacity-70" aria-hidden />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <FavoritesNav onNavigate={onNavigate} className="mt-3" />

      <section
        className="mt-3 flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2"
        aria-labelledby="sidebar-folders-heading"
      >
        <header className="flex items-center justify-between gap-2 px-1.5">
          <h2
            id="sidebar-folders-heading"
            className="font-meta text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
          >
            Priečinky
          </h2>
          <data
            value={folders.length}
            className="rounded-md bg-sidebar-accent px-1.5 py-0.5 font-meta text-[10px] text-muted-foreground tabular-nums ring-1 ring-sidebar-border/60"
          >
            {folders.length}
          </data>
        </header>
        <FolderTree
          folders={folders}
          activeFolderId={pathname.startsWith('/files') ? activeFolderId : null}
          onNavigate={onNavigate}
        />
      </section>

      <footer className="space-y-3 border-t border-sidebar-border p-3">
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="w-full space-y-1.5 px-1 text-left"
              aria-labelledby="sidebar-storage-heading"
            >
              <header className="flex justify-between text-xs text-muted-foreground">
                <h2 id="sidebar-storage-heading" className="font-normal">
                  Úložisko
                </h2>
                <output
                  htmlFor="sidebar-storage-meter"
                  className="font-meta tabular-nums"
                  aria-live="polite"
                >
                  {usedPct}%
                </output>
              </header>
              <Progress
                id="sidebar-storage-meter"
                value={usedPct}
                className="h-1"
                aria-label={`Využitie úložiska ${usedPct} percent`}
              />
              <p className="font-meta text-[11px] text-sidebar-foreground/60">
                <data value={stats.totalBytes}>
                  {formatFileSize(stats.totalBytes)}
                </data>
                {' / '}
                <data value={stats.quotaBytes}>
                  {formatFileSize(stats.quotaBytes)}
                </data>
                {' · '}
                <data value={stats.fileCount}>{stats.fileCount}</data> súborov
              </p>
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-56 text-sm">
            <p className="font-medium">Využitie Drive</p>
            <p className="mt-1 text-muted-foreground">
              {stats.folderCount} priečinkov · {stats.fileCount} súborov ·{' '}
              {formatFileSize(stats.totalBytes)} z{' '}
              {formatFileSize(stats.quotaBytes)}
            </p>
          </HoverCardContent>
        </HoverCard>

        <address className="flex items-center gap-2 rounded-md px-1 py-1 not-italic">
          <Avatar className="size-7 rounded-full">
            <AvatarFallback className="rounded-full bg-secondary text-xs font-medium">
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            {userEmail ? (
              <a
                href={`mailto:${userEmail}`}
                className="block truncate text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              >
                {userEmail}
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Odhlásiť"
            onClick={async () => {
              await signOut({ redirectUrl: '/sign-in' })
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </address>
      </footer>
    </aside>
  )
}
