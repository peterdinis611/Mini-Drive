import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, Lock } from 'lucide-react'
import { toast } from '#/lib/toast'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
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
  const [embedPath, setEmbedPath] = useState<string | null>(null)
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setCreatedPath(null)
      setEmbedPath(null)
      setCopied(false)
      setPasswordProtected(false)
      setUsePassword(false)
      setPassword('')
      setExpiresIn(resolveDefaultExpiresIn(defaultExpiresIn))
    }
  }, [open, fileId, defaultExpiresIn])

  async function handleCreate() {
    if (!fileId) {
      toast.error('Chýba súbor na zdieľanie')
      return
    }

    const payload = {
      fileId,
      expiresIn,
      ...(usePassword && password ? { password } : {}),
    }
    const parsed = createShareLinkSchema.safeParse(payload)
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? 'Neplatné nastavenie zdieľania',
      )
      return
    }
    if (usePassword && !password) {
      toast.error('Zadaj heslo alebo vypni ochranu')
      return
    }

    setPending(true)
    try {
      const result = await createShareLink({
        data: parsed.data,
      })
      setCreatedPath(result.path)
      setEmbedPath(result.embedPath)
      setPasswordProtected(result.passwordProtected)
      toast.success(
        result.passwordProtected
          ? 'Odkaz s heslom vytvorený'
          : 'Odkaz vytvorený',
      )
      onCreated?.()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Vytvorenie zlyhalo'))
    } finally {
      setPending(false)
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verejný odkaz</Label>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}${createdPath}`
                    : createdPath}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    void handleCopy(
                      `${window.location.origin}${createdPath}`,
                    )
                  }
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>
            {passwordProtected ? (
              <p className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="size-3.5" aria-hidden />
                Odkaz je chránený heslom — príjemca ho musí zadať pred
                otvorením.
              </p>
            ) : null}
            {embedPath ? (
              <div className="space-y-2">
                <Label>Embed náhľad</Label>
                <code className="block max-h-24 overflow-auto rounded-md bg-muted px-3 py-2 text-xs break-all">
                  {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}${embedPath}" width="100%" height="480" allow="fullscreen" title="${fileName}"></iframe>`}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void handleCopy(
                      `<iframe src="${window.location.origin}${embedPath}" width="100%" height="480" allow="fullscreen" title="${fileName}"></iframe>`,
                    )
                  }
                >
                  <Copy className="size-3.5" />
                  Kopírovať embed
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Embed stránka zobrazí náhľad (obrázok / Office Online / PDF
              download). Odkaz zrušíš v Zdieľaniach.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="space-y-3 rounded-lg border border-border/80 p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={usePassword}
                  onCheckedChange={(checked) => {
                    setUsePassword(checked === true)
                    if (checked !== true) setPassword('')
                  }}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Lock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Chrániť heslom
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Príjemca uvidí súbor až po zadaní hesla (min. 6 znakov).
                  </span>
                </span>
              </label>
              {usePassword ? (
                <div className="space-y-1.5 pl-7">
                  <Label htmlFor="share-link-password">Heslo odkazu</Label>
                  <Input
                    id="share-link-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="aspoň 6 znakov"
                  />
                </div>
              ) : null}
            </div>
          </div>
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
            <Button
              type="button"
              onClick={handleCreate}
              disabled={pending || !fileId}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              Vytvoriť odkaz
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
