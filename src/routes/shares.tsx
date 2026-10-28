import { useMemo, useState, useTransition } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Copy, Eye, Link2, Link2Off, Lock } from 'lucide-react'
import { toast } from '#/lib/toast'

import { ShareAccessLogDialog } from '#/components/files/share-access-log-dialog'
import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { AppShellPending } from '#/components/ui/preload-spinner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import { EmptyState } from '#/components/ui/empty-state'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { getAppChrome } from '#/server/functions/drive'
import { listShareLinks, revokeShareLink } from '#/server/functions/shares'

export const Route = createFileRoute('/shares')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, shares] = await Promise.all([
      getAppChrome(),
      listShareLinks(),
    ])
    return { chrome, shares }
  },
  head: () => privateAppHead('Zdieľania', '/shares'),
  pendingComponent: function SharesPending() {
    return <AppShellPending label="Načítavam zdieľania…" />
  },
  component: SharesPage,
})

type ShareRow = Awaited<ReturnType<typeof listShareLinks>>[number]

const columnHelper = createDataTableColumnHelper<ShareRow>()

function SharesPage() {
  const { chrome, shares } = Route.useLoaderData()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [auditShare, setAuditShare] = useState<ShareRow | null>(null)

  const activeCount = useMemo(
    () => shares.filter((s) => s.status === 'active').length,
    [shares],
  )

  function refresh() {
    void router.invalidate()
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('fileName', {
          header: 'Súbor',
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="inline-flex max-w-full items-center gap-1.5 truncate font-medium">
                {row.original.passwordProtected ? (
                  <Lock
                    className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-label="Chránené heslom"
                  />
                ) : null}
                <span className="truncate">{row.original.fileName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(row.original.fileSize)}
              </p>
            </div>
          ),
          meta: { primary: true },
        }),
        columnHelper.accessor('status', {
          header: 'Stav',
          cell: ({ row }) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={row.original.status} />
              {row.original.passwordProtected ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                >
                  <Lock className="size-3" aria-hidden />
                  Heslo
                </Badge>
              ) : null}
            </div>
          ),
          meta: { hideBelow: 'sm', mobileLabel: 'Stav' },
        }),
        columnHelper.accessor('accessCount', {
          header: 'Otvorenia',
          cell: ({ row }) => (
            <button
              type="button"
              className="font-meta text-sm text-primary underline-offset-2 hover:underline"
              onClick={() => setAuditShare(row.original)}
            >
              {row.original.accessCount}
            </button>
          ),
          meta: { hideBelow: 'sm', mobileLabel: 'Otvorenia' },
        }),
        columnHelper.accessor('expiresAt', {
          header: 'Platnosť',
          cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(getValue())}
            </span>
          ),
          meta: { hideBelow: 'md', mobileLabel: 'Platnosť' },
        }),
        columnHelper.accessor('createdAt', {
          header: 'Vytvorené',
          cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(getValue())}
            </span>
          ),
          meta: { hideBelow: 'lg', mobileLabel: 'Vytvorené' },
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Akcie',
          cell: ({ row }) => {
            const share = row.original
            return (
              <div className="inline-flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Audit otvorení"
                  onClick={() => setAuditShare(share)}
                >
                  <Eye className="size-4" />
                </Button>
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
                          getErrorMessage(error, 'Revoke zlyhal'),
                        )
                      }
                    })
                  }}
                >
                  <Link2Off className="size-4" />
                  Revoke
                </Button>
              </div>
            )
          },
          meta: {
            actions: true,
            headerClassName: 'w-48 text-right',
            cellClassName: 'text-right',
          },
        }),
      ]),
    [pending],
  )

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Zdieľania"
      subtitle={`${activeCount} aktívnych · ${shares.length} celkom`}
    >
      <FadeIn>
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
          {shares.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="Zatiaľ žiadne odkazy"
              description="V súboroch zvolíš „Zdieľať“ a vytvoríš safe-url s expiráciou."
              action={
                <Button asChild>
                  <Link to="/files">Prejsť do súborov</Link>
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={shares}
              getRowId={(row) => row.id}
            />
          )}
        </section>
      </FadeIn>

      <ShareAccessLogDialog
        open={Boolean(auditShare)}
        shareId={auditShare?.id ?? null}
        fileName={auditShare?.fileName ?? ''}
        onOpenChange={(open) => {
          if (!open) setAuditShare(null)
        }}
      />
    </AppShell>
  )
}

function StatusBadge({
  status,
}: {
  status: 'active' | 'expired' | 'revoked'
}) {
  return (
    <Badge
      variant={
        status === 'active'
          ? 'default'
          : status === 'revoked'
            ? 'destructive'
            : 'secondary'
      }
    >
      {status === 'active'
        ? 'Aktívny'
        : status === 'expired'
          ? 'Vypršaný'
          : 'Zrušený'}
    </Badge>
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
