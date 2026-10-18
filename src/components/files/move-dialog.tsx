import { useEffect, useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { formatFolderPath } from '#/lib/folder-ops'
import type { FolderTreeNode } from './types'

type Props = {
  open: boolean
  title: string
  folders: FolderTreeNode[]
  excludeFolderIds?: string[]
  /** Preselect current location when opening. */
  initialFolderId?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (folderId: string | null) => Promise<void> | void
}

export function MoveDialog({
  open,
  title,
  folders,
  excludeFolderIds = [],
  initialFolderId = null,
  onOpenChange,
  onSubmit,
}: Props) {
  const [target, setTarget] = useState<string | null | undefined>(undefined)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) setTarget(initialFolderId)
    else setTarget(undefined)
  }, [initialFolderId, open])

  const options = useMemo(() => {
    const excluded = new Set(excludeFolderIds)
    const opts: Array<{ id: string | null; label: string }> = [
      { id: null, label: 'Súbory (koreň)' },
    ]
    for (const folder of folders) {
      if (excluded.has(folder.id)) continue
      opts.push({ id: folder.id, label: formatFolderPath(folder, folders) })
    }
    return opts
  }, [folders, excludeFolderIds])

  const canSubmit = target !== undefined && !pending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTarget(undefined)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Vyber cieľový priečinok a potvrď.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-1">
          {options.map((option) => {
            const selected = target === option.id
            return (
              <button
                key={option.id ?? 'root'}
                type="button"
                className={`flex w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  selected
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setTarget(option.id)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Zrušiť
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (target === undefined) return
              setPending(true)
              void Promise.resolve(onSubmit(target))
                .catch(() => undefined)
                .finally(() => setPending(false))
            }}
          >
            Presunúť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
