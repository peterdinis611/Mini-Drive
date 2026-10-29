'use client'

import { History, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { PreloadSpinner } from '#/components/ui/preload-spinner'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { toast } from '#/lib/toast'
import { listFileVersions, restoreFileVersion } from '#/server/functions/files'

type Props = {
  open: boolean
  fileId: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
  onRestored?: () => void
}

type VersionRow = {
  id: string
  version: number
  name: string
  size: number
  mimeType: string
  createdAt: Date | string | number
}

export function FileVersionsDialog({
  open,
  fileId,
  fileName,
  onOpenChange,
  onRestored,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<number | null>(null)
  const [versions, setVersions] = useState<VersionRow[]>([])

  useEffect(() => {
    if (!open || !fileId) return
    let cancelled = false
    setLoading(true)
    void listFileVersions({ data: { fileId } })
      .then((result) => {
        if (cancelled) return
        setCurrentVersion(result.current.currentVersion)
        setVersions(result.versions)
      })
      .catch((error) => {
        if (cancelled) return
        toast.error(getErrorMessage(error))
        onOpenChange(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, fileId, onOpenChange])

  async function handleRestore(versionId: string) {
    if (!fileId) return
    setRestoring(versionId)
    try {
      await restoreFileVersion({ data: { fileId, versionId } })
      toast.success('Verzia obnovená')
      onRestored?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" aria-hidden />
            Verzie — {fileName}
          </DialogTitle>
          <DialogDescription>
            Aktuálna verzia {currentVersion ?? '—'}. Obnovením archivovanej
            verzie vytvoríš novú revíziu z aktuálneho stavu.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <PreloadSpinner label="Načítavam verzie…" />
          </div>
        ) : versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Zatiaľ žiadne archivované verzie. Nahraď súbor a tu sa zobrazia.
          </p>
        ) : (
          <ul className="m-0 max-h-[50vh] list-none space-y-2 overflow-y-auto p-0">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    v{version.version} · {version.name}
                  </p>
                  <p className="font-meta text-[11px] text-muted-foreground">
                    {formatFileSize(version.size)} ·{' '}
                    {formatDate(version.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={restoring === version.id}
                  onClick={() => void handleRestore(version.id)}
                >
                  <RotateCcw className="size-3.5" />
                  Obnoviť
                </Button>
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
  })
}
