import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Clock3, Link2Off, ShieldAlert } from 'lucide-react'

import { ThemeToggle } from '#/components/theme-toggle'
import { APP_NAME } from '#/lib/constants'
import { resolvePublicShare } from '#/server/functions/shares'

export const Route = createFileRoute('/s/$token')({
  loader: async ({ params }) =>
    resolvePublicShare({ data: { token: params.token } }),
  component: PublicSharePage,
})

function PublicSharePage() {
  const data = Route.useLoaderData()

  useEffect(() => {
    if (data.status === 'ok') {
      window.location.replace(data.url)
    }
  }, [data])

  if (data.status === 'ok') {
    return (
      <ShareShell>
        <Link2Off className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-semibold">Sťahujem súbor…</h1>
        <p className="text-sm text-muted-foreground">
          {data.fileName}
          <br />
          Presmerovanie na krátkodobý signed URL.
        </p>
        <a
          href={data.url}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Klikni sem, ak sa nič nedeje
        </a>
      </ShareShell>
    )
  }

  if (data.status === 'rate_limited') {
    return (
      <ShareShell>
        <ShieldAlert className="size-8 text-destructive" aria-hidden />
        <h1 className="text-xl font-semibold">Príliš veľa požiadaviek</h1>
        <p className="text-sm text-muted-foreground">
          Skús to znova o{' '}
          {Math.max(1, Math.ceil(data.retryAfterMs / 1000))} s.
        </p>
      </ShareShell>
    )
  }

  const reasonLabel =
    data.reason === 'revoked'
      ? 'Odkaz bol zrušený'
      : data.reason === 'expired'
        ? 'Odkaz vypršal'
        : 'Odkaz neexistuje'

  return (
    <ShareShell>
      <Clock3 className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">{reasonLabel}</h1>
      <p className="text-sm text-muted-foreground">
        {data.reason === 'not_found'
          ? 'Tento safe-url nie je platný (HTTP 410).'
          : `Súbor „${data.fileName ?? '—'}“ už nie je dostupný cez tento odkaz (HTTP 410).`}
      </p>
    </ShareShell>
  )
}

function ShareShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-10">
      <header className="mb-12 flex items-center justify-between">
        <p className="text-sm font-semibold">{APP_NAME}</p>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        {children}
      </div>
    </div>
  )
}
