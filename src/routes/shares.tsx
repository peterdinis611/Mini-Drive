import { useMemo, useTransition } from 'react'
import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Copy, Link2, Link2Off } from 'lucide-react'
import { toast } from 'sonner'

import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatFileSize } from '#/lib/format'
import { getAppChrome } from '#/server/functions/drive'
import { listShareLinks, revokeShareLink } from '#/server/functions/shares'
import { getSession } from '#/server/session'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/shares')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    if (!session.user.onboardedAt) throw redirect({ to: '/onboarding' })
    return { session }
  },
  loader: async () => {
    const [chrome, shares] = await Promise.all([
      getAppChrome(),
      listShareLinks(),
    ])
    return { chrome, shares }
  },
  component: SharesPage,
})

function SharesPage() {
  const { chrome, shares } = Route.useLoaderData()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const activeCount = useMemo(
    () => shares.filter((s) => s.status === 'active').length,
    [shares],
  )

  function refresh() {
    void router.invalidate()
  }

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Zdieľania"
      subtitle={`${activeCount} aktívnych · ${shares.length} celkom`}
    >
      <section className="animate-rise">
        {shares.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Link2 className="size-8 text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Zatiaľ žiadne odkazy</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                V súboroch zvolíš „Zdieľať“ a vytvoríš safe-url s expiráciou.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/files">Prejsť do súborov</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Súbor</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Platnosť</TableHead>
                <TableHead>Vytvorené</TableHead>
                <TableHead className="w-40 text-right">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shares.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{share.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(share.fileSize)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={share.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(share.expiresAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(share.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Kopírovať"
                        disabled={share.status !== 'active'}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}${share.path}`,
                            )
                            toast.success('Skopírované')
                          } catch {
                            toast.error('Kopírovanie zlyhalo')
                          }
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending || share.status !== 'active'}
                        onClick={() => {
                          startTransition(async () => {
                            try {
                              await revokeShareLink({
                                data: { shareId: share.id },
                              })
                              toast.success('Odkaz zrušený')
                              refresh()
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : 'Revoke zlyhal',
                              )
                            }
                          })
                        }}
                      >
                        <Link2Off className="size-4" />
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </AppShell>
  )
}

function StatusBadge({
  status,
}: {
  status: 'active' | 'expired' | 'revoked'
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
        status === 'active' && 'bg-accent text-accent-foreground',
        status === 'expired' && 'bg-muted text-muted-foreground',
        status === 'revoked' && 'bg-destructive/10 text-destructive',
      )}
    >
      {status === 'active'
        ? 'Aktívny'
        : status === 'expired'
          ? 'Vypršaný'
          : 'Zrušený'}
    </span>
  )
}

function formatDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
