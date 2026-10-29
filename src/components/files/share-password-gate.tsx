'use client'

import { Loader2, Lock } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { getErrorMessage } from '#/lib/errors'
import { unlockPublicShare } from '#/server/functions/shares'

export type UnlockedShare = {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  signedUrlExpiresIn: number
}

type Props = {
  token: string
  fileName?: string
  compact?: boolean
  onUnlocked: (share: UnlockedShare) => void
}

export function SharePasswordGate({
  token,
  fileName,
  compact,
  onUnlocked,
}: Props) {
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const result = await unlockPublicShare({
        data: { token, password },
      })
      if (result.status === 'ok') {
        onUnlocked({
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          signedUrlExpiresIn: result.signedUrlExpiresIn,
        })
        return
      }
      if (result.status === 'password_invalid') {
        setError('Nesprávne heslo')
        return
      }
      if (result.status === 'rate_limited') {
        setError(
          `Príliš veľa pokusov. Skús o ${Math.max(1, Math.ceil(result.retryAfterMs / 1000))} s.`,
        )
        return
      }
      setError('Odkaz už nie je platný')
    } catch (err) {
      setError(getErrorMessage(err, 'Odomknutie zlyhalo'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={
        compact
          ? 'mx-auto flex w-full max-w-sm flex-col gap-3 p-6'
          : 'mx-auto flex w-full max-w-sm flex-col gap-4'
      }
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/60">
          <Lock
            className="size-5 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
        </span>
        <h1 className="font-display text-xl">Chránené heslom</h1>
        <p className="text-sm text-muted-foreground">
          {fileName
            ? `Safe-url na „${fileName}“ vyžaduje heslo.`
            : 'Tento safe-url vyžaduje heslo.'}
        </p>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="share-password">Heslo</Label>
        <Input
          id="share-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Zadaj heslo k odkazu"
          disabled={pending}
          autoFocus
        />
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending || password.length === 0}>
        {pending ? <Loader2 className="animate-spin" /> : <Lock />}
        Odomknúť
      </Button>
    </form>
  )
}
