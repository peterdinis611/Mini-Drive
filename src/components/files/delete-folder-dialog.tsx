import { useEffect, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { buttonVariants } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/utils'
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zmazať priečinok</AlertDialogTitle>
          <AlertDialogDescription>
            Presunie „{folderName}“ a obsah do Koša (dá sa obnoviť).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md bg-muted/60 px-4 py-3 text-sm">
          {summary ? (
            <p>
              Do koša ide <strong>{summary.folderCount}</strong> priečinkov a{' '}
              <strong>{summary.fileCount}</strong> súborov.
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Spinner className="size-3.5" />
              Počítam obsah…
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Zrušiť</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: 'destructive' }))}
            disabled={pending || !summary}
            onClick={(event) => {
              event.preventDefault()
              setPending(true)
              void Promise.resolve(onConfirm())
                .catch(() => undefined)
                .finally(() => setPending(false))
            }}
          >
            {pending ? <Spinner className="size-3.5" /> : null}
            Presunúť do koša
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
