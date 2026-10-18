import { useMemo, useTransition } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Copy, Link2, Link2Off } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from '#/lib/toast'

import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { cn } from '#/lib/utils'
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
  component: SharesPage,
})

function SharesPage() {
  const { chrome, shares } = Route.useLoaderData()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const reduce = useReducedMotion()

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
      <FadeIn>
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
          {shares.length === 0 ? (
            <EmptyState
              icon={Link2}
              scene="shares"
              title="Zatiaľ žiadne odkazy"
              description="V súboroch zvolíš „Zdieľať“ a vytvoríš safe-url s expiráciou."
              action={
                <Button asChild>
                  <Link to="/files">Prejsť do súborov</Link>
                </Button>
              }
            />
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
                {shares.map((share, index) => (
                  <motion.tr
                    key={share.id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                      delay: reduce ? 0 : index * 0.045,
                    }}
                    className="border-b transition-colors hover:bg-muted/40"
                    whileHover={reduce ? undefined : { x: 2 }}
                  >
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
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </FadeIn>
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
