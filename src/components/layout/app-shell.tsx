import { useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { AppSidebar } from '#/components/layout/app-sidebar'
import type { DriveStats } from '#/components/layout/app-sidebar'
import {
  ScrollToTopButton,
  ScrollToTopOnNavigate,
} from '#/components/layout/scroll-to-top'
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
      <div className="app-frame">
        <div className="app-frame-inner flex min-h-[inherit]">
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
                <div className="sticky top-0 h-[calc(100svh-2*clamp(0.45rem,1.2vw,0.85rem))]">
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
              <AppErrorBoundary
                variant="section"
                name="app-main"
                resetKeys={[title]}
                sectionTitle="Obsah stránky zlyhal"
              >
                {children}
              </AppErrorBoundary>
            </motion.main>
          </div>

          <ScrollToTopOnNavigate />
          <ScrollToTopButton />
        </div>
      </div>
    </TooltipProvider>
  )
}
