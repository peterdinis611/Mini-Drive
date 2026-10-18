import { useEffect, useId, useState } from 'react'

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
  description?: string
  initialValue?: string
  confirmLabel?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<void> | void
}

export function NameDialog({
  open,
  title,
  description,
  initialValue = '',
  confirmLabel = 'Uložiť',
  onOpenChange,
  onSubmit,
}: Props) {
  const id = useId()
  const [name, setName] = useState(initialValue)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) setName(initialValue)
  }, [open, initialValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setPending(true)
            void Promise.resolve(onSubmit(name.trim()))
              .catch(() => undefined)
              .finally(() => setPending(false))
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={id}>Názov</Label>
            <Input
              id={id}
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
            />
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
            <Button type="submit" disabled={pending || !name.trim()}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
