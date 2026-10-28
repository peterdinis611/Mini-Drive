import { useEffect, useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { toast } from '#/lib/toast'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { SHARE_EXPIRY_PRESETS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { createShareLinkSchema } from '#/lib/validation'
import { createShareLink } from '#/server/functions/shares'
import { cn } from '#/lib/utils'

type Props = {
  open: boolean
  fileId: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  /** From user settings — falls back to 1 hour. */
  defaultExpiresIn?: number
}

function resolveDefaultExpiresIn(value: number | undefined) {
  if (
    value != null &&
    SHARE_EXPIRY_PRESETS.some((preset) => preset.value === value)
  ) {
    return value
  }
  return SHARE_EXPIRY_PRESETS[1].value
}

export function ShareDialog({
  open,
  fileId,
  fileName,
  onOpenChange,
  onCreated,
  defaultExpiresIn,
}: Props) {
  const [expiresIn, setExpiresIn] = useState<number>(() =>
    resolveDefaultExpiresIn(defaultExpiresIn),
  )
  const [pending, setPending] = useState(false)
  const [createdPath, setCreatedPath] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setCreatedPath(null)
      setCopied(false)
      setExpiresIn(resolveDefaultExpiresIn(defaultExpiresIn))
    }
  }, [open, fileId, defaultExpiresIn])

  async function handleCreate() {
    if (!fileId) {
      toast.error('Chýba súbor na zdieľanie')
      return
    }

    const parsed = createShareLinkSchema.safeParse({ fileId, expiresIn })
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? 'Neplatné nastavenie zdieľania',
      )
      return
    }

    setPending(true)
    try {
      const result = await createShareLink({
        data: parsed.data,
      })
      setCreatedPath(result.path)
      toast.success('Odkaz vytvorený')
      onCreated?.()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Vytvorenie zlyhalo'))
    } finally {
      setPending(false)
    }
  }

  async function handleCopy() {
    if (!createdPath) return
    const url = `${window.location.origin}${createdPath}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Skopírované')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Nepodarilo sa skopírovať')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zdieľať súbor</DialogTitle>
          <DialogDescription>
            Safe-url pre „{fileName}“. Pred vytvorením odkazu sa súbor skenuje
            na malware. UploadThing kľúč nikdy nie je v odkaze.
          </DialogDescription>
        </DialogHeader>

        {createdPath ? (
          <div className="space-y-3">
            <Label>Verejný odkaz</Label>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}${createdPath}`
                  : createdPath}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pre obrázky otvorí safe viewer (bez odhalenia UploadThing kľúča).
              Ostatné súbory redirectnú na krátky signed URL (5 min). Odkaz
              zrušíš v Zdieľaniach.
            </p>
          </div>
        ) : (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Platnosť</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SHARE_EXPIRY_PRESETS.map((preset) => {
                const selected = expiresIn === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      'rounded-md border p-3 text-left text-sm transition',
                      selected
                        ? 'border-foreground bg-primary/25 dark:border-primary dark:bg-primary/20'
                        : 'border-border hover:bg-muted/60',
                    )}
                    onClick={() => setExpiresIn(preset.value)}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {createdPath ? 'Zavrieť' : 'Zrušiť'}
          </Button>
          {!createdPath ? (
            <Button type="button" onClick={handleCreate} disabled={pending || !fileId}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Vytvoriť odkaz
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
