import { Suspense, useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { DriveSearchHost } from '#/components/files/drive-search-dialog'
import { DriveHotkeys } from '#/components/hotkeys/drive-hotkeys'
import { HotkeysCheatSheetHost } from '#/components/hotkeys/hotkeys-cheat-sheet'
import { AppSidebar } from '#/components/layout/app-sidebar'
import type { DriveStats } from '#/components/layout/app-sidebar'
import { QuickActionsFab } from '#/components/layout/quick-actions-fab'
import type { FolderTreeNode } from '#/components/files/types'
import { Button } from '#/components/ui/button'
import { SectionLoading } from '#/components/ui/preload-spinner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { TooltipProvider } from '#/components/ui/tooltip'
import { useSidebarWidth } from '#/hooks/use-sidebar-width'
import { APP_NAME } from '#/lib/constants'
import { riseTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

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
  const [resizing, setResizing] = useState(false)
  const {
    width,
    resetWidth,
    onResizePointerDown,
    onResizeKeyDown,
    min,
    max,
  } = useSidebarWidth()

  return (
    <TooltipProvider delayDuration={200}>
      <div className="app-frame">
        <div className="app-frame-inner flex min-h-[inherit]">
          <AnimatePresence initial={false}>
            {!desktopCollapsed ? (
              <motion.div
                key="sidebar"
                className="relative hidden shrink-0 lg:block"
                initial={reduce ? false : { width: 0, opacity: 0 }}
                animate={{ width, opacity: 1 }}
                exit={reduce ? undefined : { width: 0, opacity: 0 }}
                transition={
                  resizing || reduce
                    ? { duration: 0 }
                    : { ...riseTransition, width: { type: 'spring', stiffness: 380, damping: 36 } }
                }
                style={{ width }}
              >
                <div
                  className="sticky top-0 h-[calc(100svh-2*clamp(0.45rem,1.2vw,0.85rem))]"
                  style={{ width }}
                >
                  <AppSidebar
                    userName={userName}
                    userEmail={userEmail}
                    folders={folders}
                    activeFolderId={activeFolderId}
                    stats={stats}
                    onCollapse={() => setDesktopCollapsed(true)}
                  />
                </div>

                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Šírka bočného panela"
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={width}
                  aria-valuetext={`${width} pixelov`}
                  tabIndex={0}
                  title="Potiahni na zmenu šírky · dvojklik obnoví predvolenú"
                  className={cn(
                    'group absolute top-0 right-0 z-30 flex h-full w-3 translate-x-1/2 cursor-col-resize touch-none items-center justify-center outline-none',
                    'focus-visible:ring-2 focus-visible:ring-sidebar-ring/70',
                  )}
                  onPointerDown={(event) => {
                    setResizing(true)
                    onResizePointerDown(event)
                    const finish = () => {
                      setResizing(false)
                      window.removeEventListener('pointerup', finish)
                      window.removeEventListener('pointercancel', finish)
                    }
                    window.addEventListener('pointerup', finish)
                    window.addEventListener('pointercancel', finish)
                  }}
                  onDoubleClick={() => resetWidth()}
                  onKeyDown={onResizeKeyDown}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-12 w-1 rounded-full bg-sidebar-border transition',
                      'group-hover:h-16 group-hover:bg-primary/70',
                      'group-focus-visible:bg-primary',
                      resizing && 'h-20 bg-primary',
                    )}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              className="w-[min(100vw,280px)] border-sidebar-border bg-sidebar p-0 sm:max-w-[280px]"
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
                  <motion.menu
                    className="m-0 flex list-none flex-wrap items-center gap-2 p-0"
                    aria-label="Akcie stránky"
                    initial={reduce ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...riseTransition, delay: 0.05 }}
                  >
                    {actions}
                  </motion.menu>
                ) : null}
              </div>
            </header>

            <motion.main
              id="main-content"
              className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...riseTransition, delay: 0.04 }}
            >
              <AppErrorBoundary
                variant="section"
                name="app-main"
                resetKeys={[title]}
                sectionTitle="Obsah stránky zlyhal"
              >
                <Suspense fallback={<SectionLoading />}>
                  {children}
                </Suspense>
              </AppErrorBoundary>
            </motion.main>
          </div>
        </div>
        <DriveSearchHost />
        <DriveHotkeys />
        <HotkeysCheatSheetHost />
        <QuickActionsFab />
      </div>
    </TooltipProvider>
  )
}
