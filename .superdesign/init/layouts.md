# Layouts

## `src/components/layout/app-shell.tsx`

```tsx
import { useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { AppSidebar } from '#/components/layout/app-sidebar'
import type { DriveStats } from '#/components/layout/app-sidebar'
import type { FolderTreeNode } from '#/components/files/types'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { TooltipProvider } from '#/components/ui/tooltip'
import { APP_NAME } from '#/lib/constants'
import { riseTransition } from '#/lib/motion'

type Props = {
  userName: string
  userEmail?: string
  folders: FolderTreeNode[]
  activeFolderId?: string | null
  stats: DriveStats
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({
  userName,
  userEmail,
  folders,
  activeFolderId = null,
  stats,
  title,
  subtitle,
  actions,
  children,
}: Props) {
  const reduce = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh bg-background">
        <AnimatePresence initial={false}>
          {!desktopCollapsed ? (
            <motion.div
              key="sidebar"
              className="hidden lg:block"
              initial={reduce ? false : { width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={reduce ? undefined : { width: 0, opacity: 0 }}
              transition={riseTransition}
            >
              <div className="sticky top-0 h-svh">
                <AppSidebar
                  userName={userName}
                  userEmail={userEmail}
                  folders={folders}
                  activeFolderId={activeFolderId}
                  stats={stats}
                  onCollapse={() => setDesktopCollapsed(true)}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-[260px] border-sidebar-border bg-sidebar p-0 sm:max-w-[260px]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{APP_NAME}</SheetTitle>
            </SheetHeader>
            <AppSidebar
              userName={userName}
              userEmail={userEmail}
              folders={folders}
              activeFolderId={activeFolderId}
              stats={stats}
              onNavigate={() => setMobileOpen(false)}
              className="w-full border-0"
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="lg:hidden"
                  aria-label="Menu"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu />
                </Button>
                {desktopCollapsed ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="hidden lg:inline-flex"
                    aria-label="Sidebar"
                    onClick={() => setDesktopCollapsed(false)}
                  >
                    <PanelLeft />
                  </Button>
                ) : null}
                <div className="min-w-0 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={title}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -6 }}
                      transition={riseTransition}
                    >
                      <h1 className="font-display truncate text-[28px] leading-tight text-foreground sm:text-[32px]">
                        {title}
                      </h1>
                      {subtitle ? (
                        <p className="truncate text-sm text-muted-foreground">
                          {subtitle}
                        </p>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              {actions ? (
                <motion.div
                  className="flex flex-wrap items-center gap-2"
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...riseTransition, delay: 0.05 }}
                >
                  {actions}
                </motion.div>
              ) : null}
            </div>
          </header>

          <motion.main
            className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...riseTransition, delay: 0.04 }}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </TooltipProvider>
  )
}
```

## `src/components/layout/app-sidebar.tsx`

```tsx
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Clock3,
  FileText,
  Link2,
  LogOut,
  Settings2,
  PanelLeftClose,
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
```

## `src/components/layout/folder-tree.tsx`

```tsx
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Folder, HardDrive } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { FolderTreeNode } from '#/components/files/types'

type Props = {
  folders: FolderTreeNode[]
  activeFolderId: string | null
  onNavigate?: () => void
}

type TreeItem = FolderTreeNode & { children: TreeItem[] }

export function FolderTree({ folders, activeFolderId, onNavigate }: Props) {
  const tree = useMemo(() => buildTree(folders), [folders])
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-0.5">
      <Link
        to="/files"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition',
          activeFolderId === null
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
        )}
      >
        <HardDrive className="size-4 shrink-0 opacity-70" />
        <span className="truncate">Všetky súbory</span>
      </Link>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          activeFolderId={activeFolderId}
          open={open}
          setOpen={setOpen}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  activeFolderId,
  open,
  setOpen,
  onNavigate,
}: {
  node: TreeItem
  depth: number
  activeFolderId: string | null
  open: Record<string, boolean>
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onNavigate?: () => void
}) {
  const hasChildren = node.children.length > 0
  const isOpen = open[node.id] ?? depth < 1
  const active = activeFolderId === node.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-0.5 rounded-md',
          active
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/70',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center text-muted-foreground"
          aria-label={isOpen ? 'Zbaliť' : 'Rozbaliť'}
          onClick={() =>
            setOpen((prev) => ({ ...prev, [node.id]: !isOpen }))
          }
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="size-3.5" />
          )}
        </button>
        <Link
          to="/files/$folderId"
          params={{ folderId: node.id }}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-sm"
        >
          <Folder className="size-4 shrink-0 opacity-80" />
          <span className="truncate">{node.name}</span>
        </Link>
      </div>
      {hasChildren && isOpen
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              open={open}
              setOpen={setOpen}
              onNavigate={onNavigate}
            />
          ))
        : null}
    </div>
  )
}

function buildTree(folders: FolderTreeNode[]): TreeItem[] {
  const map = new Map<string, TreeItem>()
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] })
  }
  const roots: TreeItem[] = []
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(item)
    } else {
      roots.push(item)
    }
  }
  const sortRecursive = (nodes: TreeItem[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'sk'))
    for (const node of nodes) sortRecursive(node.children)
  }
  sortRecursive(roots)
  return roots
}
```

## `src/components/layout/atmosphere-shell.tsx`

```tsx
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'

import { AtmosphereBackdrop } from '#/components/three/atmosphere-backdrop'
import { ThemeToggle } from '#/components/theme-toggle'
import { APP_NAME } from '#/lib/constants'
import { riseTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  /** Wider content for onboarding */
  wide?: boolean
  showHeader?: boolean
  intensity?: 'soft' | 'bold'
  className?: string
  headerRight?: ReactNode
}

export function AtmosphereShell({
  children,
  wide = false,
  showHeader = true,
  intensity = 'soft',
  className,
  headerRight,
}: Props) {
  const reduce = useReducedMotion()

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <AtmosphereBackdrop intensity={intensity} />

      {showHeader ? (
        <motion.header
          className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={riseTransition}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition hover:text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              M
            </span>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            {headerRight}
            <ThemeToggle />
          </div>
        </motion.header>
      ) : null}

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full flex-1 flex-col px-4 pb-12 sm:px-8',
          wide ? 'max-w-2xl' : 'max-w-md',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
```

