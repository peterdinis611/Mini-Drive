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
import { NAME_MAX_LENGTH } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { fileNameSchema } from '#/lib/validation'

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
  const errorId = `${id}-error`
  const [name, setName] = useState(initialValue)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialValue)
      setError(null)
      setPending(false)
    }
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
            const parsed = fileNameSchema.safeParse(name)
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message ?? 'Neplatný názov')
              return
            }

            setError(null)
            setPending(true)
            void Promise.resolve(onSubmit(parsed.data))
              .catch((err: unknown) => {
                setError(getErrorMessage(err, 'Operácia zlyhala'))
              })
              .finally(() => setPending(false))
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={id}>Názov</Label>
            <Input
              id={id}
              value={name}
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              maxLength={NAME_MAX_LENGTH}
            />
            {error ? (
              <p id={errorId} className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Bez znakov {'<>:"/\\|?*'} · max {NAME_MAX_LENGTH}
              </p>
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
            <Button type="submit" disabled={pending || !name.trim()}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
