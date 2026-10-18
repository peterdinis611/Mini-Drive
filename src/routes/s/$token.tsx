import { createFileRoute, redirect } from '@tanstack/react-router'
import { Clock3, Link2Off, ShieldAlert } from 'lucide-react'

import { ThemeToggle } from '#/components/theme-toggle'
import { APP_NAME } from '#/lib/constants'
import { buildSeoHead } from '#/lib/seo'
import { resolvePublicShare } from '#/server/functions/shares'

export const Route = createFileRoute('/s/$token')({
  loader: async ({ params }) => {
    const data = await resolvePublicShare({ data: { token: params.token } })
    if (data.status === 'ok') {
      throw redirect({
        href: data.url,
        statusCode: 302,
        headers: {
          'Cache-Control': 'no-store',
        },
      })
    }
    return data
  },
  head: ({ loaderData, params }) => {
    const fileName =
      loaderData && 'fileName' in loaderData ? loaderData.fileName : undefined
    const title = fileName
      ? `Zdieľaný súbor: ${fileName}`
      : 'Zdieľaný odkaz'
    return buildSeoHead({
      title,
      description: fileName
        ? `Safe-url odkaz na súbor „${fileName}“ v ${APP_NAME}.`
        : `Dočasný safe-url odkaz v ${APP_NAME}.`,
      path: `/s/${params.token}`,
      noIndex: true,
    })
  },
  component: PublicSharePage,
})

function PublicSharePage() {
  const data = Route.useLoaderData()

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

  const goneFileName =
    data.reason === 'not_found' ? null : data.fileName

  return (
    <ShareShell>
      <Clock3 className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">{reasonLabel}</h1>
      <p className="text-sm text-muted-foreground">
        {goneFileName
          ? `Súbor „${goneFileName}“ už nie je dostupný cez tento odkaz (HTTP 410).`
          : 'Tento safe-url nie je platný (HTTP 410).'}
      </p>
      <Link2Off className="mt-2 size-5 text-muted-foreground/60" aria-hidden />
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
