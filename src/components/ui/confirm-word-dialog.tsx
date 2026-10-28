'use client'

import { useEffect, useState } from 'react'

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

type Props = {
  open: boolean
  title: string
  description: React.ReactNode
  confirmWord: string
  confirmLabel: string
  pendingLabel?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  /** When true, confirm stays disabled (e.g. nothing to delete). */
  blocked?: boolean
  blockedMessage?: string
}

export function ConfirmWordDialog({
  open,
  title,
  description,
  confirmWord,
  confirmLabel,
  pendingLabel = 'Pracujem…',
  onOpenChange,
  onConfirm,
  blocked = false,
  blockedMessage,
}: Props) {
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)
  const canConfirm =
    !blocked &&
    typed.trim().toLocaleUpperCase('sk-SK') ===
      confirmWord.toLocaleUpperCase('sk-SK')

  useEffect(() => {
    if (!open) {
      setTyped('')
      setPending(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {blocked && blockedMessage ? (
            <p className="rounded-2xl border-2 border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {blockedMessage}
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="confirm-word-input">
                Na potvrdenie napíš{' '}
                <span className="font-mono font-semibold">{confirmWord}</span>
              </Label>
              <Input
                id="confirm-word-input"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmWord}
                disabled={pending}
              />
            </div>
          )}
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
            variant="destructive"
            disabled={pending || !canConfirm}
            onClick={() => {
              setPending(true)
              void Promise.resolve(onConfirm())
                .catch(() => undefined)
                .finally(() => setPending(false))
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
