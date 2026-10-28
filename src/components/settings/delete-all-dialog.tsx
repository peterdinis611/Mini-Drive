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
import { TRASH_RETENTION_DAYS } from '#/lib/constants'

export const DELETE_ALL_CONFIRM_WORD = 'ZMAZAŤ'

type Props = {
  open: boolean
  fileCount: number
  folderCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
}

export function DeleteAllDialog({
  open,
  fileCount,
  folderCount,
  onOpenChange,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)
  const canConfirm =
    typed.trim().toLocaleUpperCase('sk-SK') === DELETE_ALL_CONFIRM_WORD
  const empty = fileCount === 0 && folderCount === 0

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
          <DialogTitle>Zmazať všetko</DialogTitle>
          <DialogDescription>
            Presunie celý Drive do Koša. Dá sa obnoviť ešte{' '}
            {TRASH_RETENTION_DAYS} dní; trvalé vymazanie je cez „Vyprázdniť kôš“.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            {empty ? (
              <p className="text-muted-foreground">
                Úložisko je prázdne — nie je čo mazať.
              </p>
            ) : (
              <p>
                Do koša ide <strong>{folderCount}</strong> priečinkov a{' '}
                <strong>{fileCount}</strong> súborov.
              </p>
            )}
          </div>

          {!empty ? (
            <div className="space-y-2">
              <Label htmlFor="delete-all-confirm">
                Na potvrdenie napíš{' '}
                <span className="font-mono font-semibold">
                  {DELETE_ALL_CONFIRM_WORD}
                </span>
              </Label>
              <Input
                id="delete-all-confirm"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={DELETE_ALL_CONFIRM_WORD}
                disabled={pending}
              />
            </div>
          ) : null}
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
            disabled={pending || empty || !canConfirm}
            onClick={() => {
              setPending(true)
              void Promise.resolve(onConfirm())
                .catch(() => undefined)
                .finally(() => setPending(false))
            }}
          >
            {pending ? 'Mažem…' : 'Presunúť všetko do koša'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
