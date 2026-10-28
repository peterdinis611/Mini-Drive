import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { PreloadSpinner } from '#/components/ui/preload-spinner'
import { getErrorMessage } from '#/lib/errors'
import { formatIpFingerprint } from '#/lib/share-audit'
import { listShareAccessLogs } from '#/server/functions/shares'

type Props = {
  open: boolean
  shareId: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
}

type LogRow = Awaited<
  ReturnType<typeof listShareAccessLogs>
>['logs'][number]

export function ShareAccessLogDialog({
  open,
  shareId,
  fileName,
  onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogRow[]>([])
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    if (!open || !shareId) {
      setLogs([])
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void listShareAccessLogs({ data: { shareId } })
      .then((result) => {
        if (cancelled) return
        setLogs(result.logs)
        setLimit(result.limit)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Nepodarilo sa načítať audit'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, shareId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Otvorenia odkazu</DialogTitle>
          <DialogDescription>
            Audit log pre „{fileName}“ (posledných {limit}). IP je uložená
            len ako otlačok (HMAC), nie v plaintexte.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <PreloadSpinner className="py-10" size="sm" label="Načítavam…" />
        ) : error ? (
          <p className="py-6 text-sm text-destructive">{error}</p>
        ) : logs.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Zatiaľ žiadne úspešné otvorenia.
          </p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-md border border-border/70 bg-muted/30 px-3 py-2"
              >
                <p className="font-meta text-xs text-muted-foreground">
                  {formatDate(log.accessedAt)}
                </p>
                <p className="mt-0.5 font-mono text-sm font-medium">
                  {formatIpFingerprint(log.ipAddress)}
                </p>
                {log.userAgent ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {log.userAgent}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
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
    second: '2-digit',
  })
}
