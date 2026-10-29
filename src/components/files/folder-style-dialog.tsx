'use client'

import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DriveFolder } from '#/components/files/types'
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
import { cn } from '#/lib/utils'

const SWATCHES = [
  '#2f6fed',
  '#0f766e',
  '#b45309',
  '#be123c',
  '#6d28d9',
  '#334155',
]

type Props = {
  open: boolean
  folder: DriveFolder | null
  onOpenChange: (open: boolean) => void
  onSave: (color: string | null, priority: number) => void | Promise<void>
}

export function FolderStyleDialog({
  open,
  folder,
  onOpenChange,
  onSave,
}: Props) {
  const [color, setColor] = useState('#2f6fed')
  const [priority, setPriority] = useState(0)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !folder) return
    setColor(folder.color ?? '#2f6fed')
    setPriority(folder.priority ?? 0)
  }, [open, folder])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="size-4" aria-hidden />
            Farba / priorita
          </DialogTitle>
          <DialogDescription>
            {folder ? `Priečinok „${folder.name}“` : 'Priečinok'} — priorita 0–3
            (vyššia = vyššie v zozname).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Farba</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={swatch}
                  className={cn(
                    'size-8 rounded-full border-2',
                    color === swatch
                      ? 'border-foreground'
                      : 'border-transparent',
                  )}
                  style={{ background: swatch }}
                  onClick={() => setColor(swatch)}
                />
              ))}
              <button
                type="button"
                className="rounded-full border border-border px-3 text-xs"
                onClick={() => setColor('')}
              >
                Bez farby
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="folder-priority">Priorita</Label>
            <Input
              id="folder-priority"
              type="number"
              min={0}
              max={3}
              value={priority}
              onChange={(event) =>
                setPriority(
                  Math.min(3, Math.max(0, Number(event.target.value) || 0)),
                )
              }
            />
          </div>
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
              void Promise.resolve(
                onSave(color ? color : null, priority),
              ).finally(() => setPending(false))
            }}
          >
            Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
