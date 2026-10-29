'use client'

import { Copy, Trash2 } from 'lucide-react'
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
import {
  type DuplicateGroup,
  listDuplicateGroups,
} from '#/server/functions/duplicates'
import { deleteFile } from '#/server/functions/files'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}

export function DuplicatesDialog({ open, onOpenChange, onChanged }: Props) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    void listDuplicateGroups()
      .then((result) => {
        if (!cancelled) setGroups(result)
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  async function handleDelete(fileId: string) {
    setDeleting(fileId)
    try {
      await deleteFile({ data: { fileId } })
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            files: group.files.filter((file) => file.id !== fileId),
          }))
          .filter((group) => group.files.length > 1),
      )
      toast.success('Duplicitný súbor do koša')
      onChanged?.()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-4" aria-hidden />
            Duplikáty
          </DialogTitle>
          <DialogDescription>
            Súbory so zhodným SHA-256 hashom obsahu. Index sa doplní po uploade.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <PreloadSpinner label="Hľadám duplikáty…" />
          </div>
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Žiadne zistené duplikáty.
          </p>
        ) : (
          <ul className="m-0 max-h-[55vh] list-none space-y-4 overflow-y-auto p-0">
            {groups.map((group) => (
              <li
                key={group.contentHash}
                className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-3"
              >
                <p className="font-meta text-[10px] tracking-wide text-muted-foreground uppercase">
                  {group.files.length}× · {formatFileSize(group.totalSize)} ·{' '}
                  {group.contentHash.slice(0, 10)}…
                </p>
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {group.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="min-w-0 truncate text-sm">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        disabled={deleting === file.id}
                        aria-label={`Zmazať ${file.name}`}
                        onClick={() => void handleDelete(file.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
