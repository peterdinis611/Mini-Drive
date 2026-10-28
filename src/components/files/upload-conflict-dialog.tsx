'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

export type UploadConflict = {
  name: string
  fileId: string
}

type Props = {
  open: boolean
  conflicts: UploadConflict[]
  onOpenChange: (open: boolean) => void
  onKeepBoth: () => void
  onReplace: () => void
  onCancel: () => void
}

export function UploadConflictDialog({
  open,
  conflicts,
  onOpenChange,
  onKeepBoth,
  onReplace,
  onCancel,
}: Props) {
  const single = conflicts.length === 1

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden />
            Konflikt názvov
          </DialogTitle>
          <DialogDescription>
            {single
              ? `Súbor „${conflicts[0]?.name}“ už v priečinku existuje.`
              : `${conflicts.length} súborov už existuje pod rovnakým názvom.`}
          </DialogDescription>
        </DialogHeader>

        <ul className="m-0 max-h-40 list-none space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
          {conflicts.map((item) => (
            <li key={item.fileId} className="truncate">
              {item.name}
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="button" variant="secondary" onClick={onKeepBoth}>
            Ponechať oba
          </Button>
          <Button
            type="button"
            onClick={onReplace}
            disabled={conflicts.length !== 1}
            title={
              conflicts.length !== 1
                ? 'Nahradiť funguje len pre jeden konflikt naraz'
                : undefined
            }
          >
            Nahradiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Append (1), (2), … before extension until unique among `taken`. */
export function uniqueKeepBothName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name
  const lastDot = name.lastIndexOf('.')
  const hasExt = lastDot > 0
  const base = hasExt ? name.slice(0, lastDot) : name
  const ext = hasExt ? name.slice(lastDot) : ''
  let n = 1
  while (n < 1000) {
    const candidate = `${base} (${n})${ext}`
    if (!taken.has(candidate)) return candidate
    n += 1
  }
  return `${base}-${Date.now()}${ext}`
}
