import { Link, useRouterState } from '@tanstack/react-router'
import {
  Clock3,
  FileText,
  Link2,
  LogOut,
  Settings2,
  PanelLeftClose,
  Trash2,
} from 'lucide-react'

import { FolderTree } from '#/components/layout/folder-tree'
import { ThemeToggle } from '#/components/theme-toggle'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Progress } from '#/components/ui/progress'
import { ScrollArea } from '#/components/ui/scroll-area'
import type { FolderTreeNode } from '#/components/files/types'
import { APP_NAME } from '#/lib/constants'
import { formatFileSize } from '#/lib/format'
import { authClient } from '#/lib/auth-client'
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
        'flex h-full w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <Link
          to="/files"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sidebar-accent"
        >
          <span className="flex size-6 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
            M
          </span>
          <span className="truncate text-sm font-semibold">{APP_NAME}</span>
        </Link>
        <div className="flex items-center">
          <ThemeToggle />
          {onCollapse ? (
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
          ) : null}
        </div>
      </div>

      <nav className="space-y-0.5 px-2" aria-label="Navigácia">
        {NAV.map((item) => {
          const active =
            item.match === 'files'
              ? pathname === '/files' || pathname.startsWith('/files/')
              : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition',
                active
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
              )}
            >
              <item.icon className="size-4 opacity-70" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 px-4 pb-1">
        <p className="text-xs font-medium text-muted-foreground">Priečinky</p>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <FolderTree
          folders={folders}
          activeFolderId={
            pathname.startsWith('/files') ? activeFolderId : null
          }
          onNavigate={onNavigate}
        />
      </ScrollArea>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        <div className="space-y-1.5 px-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Úložisko</span>
            <span>{usedPct}%</span>
          </div>
          <Progress value={usedPct} className="h-1" />
          <p className="text-[11px] text-muted-foreground">
            {formatFileSize(stats.totalBytes)} · {stats.fileCount} súborov
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md px-1 py-1">
          <Avatar className="size-7 rounded-full">
            <AvatarFallback className="rounded-full bg-secondary text-xs font-medium">
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            {userEmail ? (
              <p className="truncate text-[11px] text-muted-foreground">
                {userEmail}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Odhlásiť"
            onClick={async () => {
              await authClient.signOut()
              window.location.href = '/login'
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
