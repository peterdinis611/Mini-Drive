import { useMemo, useState } from 'react'

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
  onOpenChange: (open: boolean) => void
  onSubmit: (folderId: string | null) => Promise<void> | void
}

export function MoveDialog({
  open,
  title,
  folders,
  excludeFolderIds = [],
  onOpenChange,
  onSubmit,
}: Props) {
  const [target, setTarget] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTarget(null)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Vyber cieľový priečinok.</DialogDescription>
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
            disabled={pending}
            onClick={() => {
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
