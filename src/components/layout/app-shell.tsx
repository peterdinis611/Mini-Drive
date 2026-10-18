import { useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'

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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh bg-background">
        {!desktopCollapsed ? (
          <div className="hidden lg:block">
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
          </div>
        ) : null}

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
                <div className="min-w-0">
                  <h1 className="font-display truncate text-[28px] leading-tight text-foreground sm:text-[32px]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              ) : null}
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
