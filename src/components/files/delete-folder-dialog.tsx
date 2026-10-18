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
import { getFolderDeleteSummary } from '#/server/functions/folders'

type Props = {
  open: boolean
  folderId: string | null
  folderName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
}

export function DeleteFolderDialog({
  open,
  folderId,
  folderName,
  onOpenChange,
  onConfirm,
}: Props) {
  const [summary, setSummary] = useState<{
    folderCount: number
    fileCount: number
  } | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !folderId) {
      setSummary(null)
      return
    }
    let cancelled = false
    void getFolderDeleteSummary({ data: { folderId } }).then((result) => {
      if (!cancelled) setSummary(result)
    })
    return () => {
      cancelled = true
    }
  }, [open, folderId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zmazať priečinok</DialogTitle>
          <DialogDescription>
            Rekurzívne zmaže „{folderName}“ vrátane obsahu.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-muted/60 px-4 py-3 text-sm">
          {summary ? (
            <p>
              Zmaže sa <strong>{summary.folderCount}</strong> priečinkov a{' '}
              <strong>{summary.fileCount}</strong> súborov (aj z UploadThing).
            </p>
          ) : (
            <p className="text-muted-foreground">Počítam obsah…</p>
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
            disabled={pending || !summary}
            onClick={() => {
              setPending(true)
              void Promise.resolve(onConfirm())
                .catch(() => undefined)
                .finally(() => setPending(false))
            }}
          >
            Zmazať natrvalo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
