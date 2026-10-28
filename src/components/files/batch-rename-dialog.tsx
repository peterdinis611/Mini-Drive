'use client'

import { useMemo, useState } from 'react'
import { Type } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { applyRenamePattern } from '#/lib/batch-rename'

type Props = {
  open: boolean
  fileNames: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (pattern: string, startAt: number) => void | Promise<void>
}

export function BatchRenameDialog({
  open,
  fileNames,
  onOpenChange,
  onSubmit,
}: Props) {
  const [pattern, setPattern] = useState('foto-{n}{ext}')
  const [startAt, setStartAt] = useState(1)
  const [pending, setPending] = useState(false)

  const preview = useMemo(
    () =>
      fileNames.slice(0, 5).map((name, index) =>
        applyRenamePattern(name, pattern, startAt + index),
      ),
    [fileNames, pattern, startAt],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="size-4" aria-hidden />
            Hromadné premenovanie
          </DialogTitle>
          <DialogDescription>
            Tokeny: {'{n}'} index, {'{name}'} názov bez prípony, {'{ext}'} prípona
            (s bodkou). {fileNames.length} súborov.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="batch-pattern">Vzor</Label>
            <Input
              id="batch-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="foto-{n}{ext}"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch-start">Začať od</Label>
            <Input
              id="batch-start"
              type="number"
              min={0}
              value={startAt}
              onChange={(event) =>
                setStartAt(Number(event.target.value) || 0)
              }
            />
          </div>
          <ul className="m-0 list-none space-y-1 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
            {preview.map((name, index) => (
              <li key={`${fileNames[index]}-${name}`} className="truncate">
                <span className="text-muted-foreground">{fileNames[index]}</span>
                {' → '}
                <span className="font-medium">{name}</span>
              </li>
            ))}
            {fileNames.length > preview.length ? (
              <li className="text-xs text-muted-foreground">
                …a ešte {fileNames.length - preview.length}
              </li>
            ) : null}
          </ul>
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
            disabled={pending || !pattern.trim()}
            onClick={() => {
              setPending(true)
              void Promise.resolve(onSubmit(pattern.trim(), startAt)).finally(
                () => setPending(false),
              )
            }}
          >
            Premenovať
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
