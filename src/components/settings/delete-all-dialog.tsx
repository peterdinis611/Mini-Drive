import { ConfirmWordDialog } from '#/components/ui/confirm-word-dialog'
import { TRASH_RETENTION_DAYS } from '#/lib/constants'
import { DELETE_ALL_CONFIRM_WORD } from '#/lib/validation'

export { DELETE_ALL_CONFIRM_WORD }

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
  const empty = fileCount === 0 && folderCount === 0

  return (
    <ConfirmWordDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Zmazať všetko"
      description={
        <>
          Presunie celý Drive do Koša. Dá sa obnoviť ešte {TRASH_RETENTION_DAYS}{' '}
          dní; trvalé vymazanie je cez „Vyprázdniť kôš“.
          {!empty ? (
            <>
              {' '}
              Do koša ide <strong>{folderCount}</strong> priečinkov a{' '}
              <strong>{fileCount}</strong> súborov.
            </>
          ) : null}
        </>
      }
      confirmWord={DELETE_ALL_CONFIRM_WORD}
      confirmLabel="Presunúť všetko do koša"
      pendingLabel="Mažem…"
      blocked={empty}
      blockedMessage="Úložisko je prázdne — nie je čo mazať."
      onConfirm={onConfirm}
    />
  )
}
