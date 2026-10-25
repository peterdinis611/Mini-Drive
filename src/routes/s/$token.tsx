import { createFileRoute, redirect } from '@tanstack/react-router'
import { Clock3, Download, Link2Off, ShieldAlert } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AtmosphereShell } from '#/components/layout/atmosphere-shell'
import { Button } from '#/components/ui/button'
import { APP_NAME } from '#/lib/constants'
import { isImageMimeType } from '#/lib/mime'
import { formatFileSize } from '#/lib/format'
import { riseTransition, scaleIn } from '#/lib/motion'
import { buildSeoHead } from '#/lib/seo'
import { resolvePublicShare } from '#/server/functions/shares'

export const Route = createFileRoute('/s/$token')({
  validateSearch: (search: Record<string, unknown>) => ({
    raw: search.raw === true || search.raw === '1' || search.raw === 'true',
  }),
  loader: async ({ params, location }) => {
    const data = await resolvePublicShare({ data: { token: params.token } })
    if (data.status !== 'ok') return data

    const search = location.search as { raw?: boolean }
    const isImage = isImageMimeType(data.mimeType, data.fileName)

    // Non-images (or ?raw=1) redirect to short-lived signed CDN URL.
    if (!isImage || search.raw) {
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
        ? `Dočasný safe-url na súbor „${fileName}“ v ${APP_NAME}. Odkaz neodhaľuje interný kľúč úložiska.`
        : `Dočasný safe-url odkaz v ${APP_NAME}. Vyžaduje platný token; nie je určený na indexáciu.`,
      path: `/s/${params.token}`,
      noIndex: true,
    })
  },
  component: PublicSharePage,
})

function PublicSharePage() {
  const data = Route.useLoaderData()
  if (!data) return null

  if (data.status === 'ok') {
    return (
      <ShareShell>
        <PublicImageViewer
          url={data.url}
          fileName={data.fileName}
          fileSize={data.fileSize}
          mimeType={data.mimeType}
          expiresIn={data.signedUrlExpiresIn}
        />
      </ShareShell>
    )
  }

  if (data.status === 'rate_limited') {
    return (
      <ShareShell>
        <ShareCard
          icon={ShieldAlert}
          iconClassName="text-destructive"
          title="Príliš veľa požiadaviek"
          description={`Skús to znova o ${Math.max(1, Math.ceil(data.retryAfterMs / 1000))} s.`}
        />
      </ShareShell>
    )
  }

  const reasonLabel =
    data.reason === 'revoked'
      ? 'Odkaz bol zrušený'
      : data.reason === 'expired'
        ? 'Odkaz vypršal'
        : 'Odkaz neexistuje'

  const goneFileName = data.reason === 'not_found' ? null : data.fileName

  return (
    <ShareShell>
      <ShareCard
        icon={Clock3}
        title={reasonLabel}
        description={
          goneFileName
            ? `Súbor „${goneFileName}“ už nie je dostupný cez tento odkaz (HTTP 410).`
            : 'Tento safe-url nie je platný (HTTP 410).'
        }
        footer={
          <Link2Off className="size-5 text-muted-foreground/60" aria-hidden />
        }
      />
    </ShareShell>
  )
}

function PublicImageViewer({
  url,
  fileName,
  fileSize,
  mimeType,
  expiresIn,
}: {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  expiresIn: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="flex w-full max-w-4xl flex-col gap-4"
      variants={reduce ? undefined : scaleIn}
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg">{fileName}</h1>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)} · {mimeType || 'obrázok'} · safe-url (
              {Math.round(expiresIn / 60)} min)
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer" download={fileName}>
              <Download />
              Stiahnuť
            </a>
          </Button>
        </div>
        <div className="flex min-h-[320px] items-center justify-center bg-muted/30 p-4 sm:p-6">
          <img
            src={url}
            alt={fileName}
            referrerPolicy="no-referrer"
            className="max-h-[min(70vh,720px)] max-w-full rounded-md object-contain shadow-sm ring-1 ring-border/60"
          />
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tento odkaz je dočasný a neodhaľuje interný kľúč úložiska.
      </p>
    </motion.div>
  )
}

function ShareShell({ children }: { children: React.ReactNode }) {
  return (
    <AtmosphereShell intensity="bold" wide className="justify-center">
      {children}
    </AtmosphereShell>
  )
}

function ShareCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  footer,
}: {
  icon: typeof Clock3
  iconClassName?: string
  title: string
  description: string
  footer?: React.ReactNode
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="w-full rounded-2xl border border-border/80 bg-background/80 p-8 text-center shadow-lg backdrop-blur-md"
      variants={reduce ? undefined : scaleIn}
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      <motion.span
        className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/60"
        animate={reduce ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon
          className={`size-6 ${iconClassName ?? 'text-muted-foreground'}`}
          aria-hidden
        />
      </motion.span>
      <h1 className="font-display text-2xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {footer ? (
        <motion.div
          className="mt-4 flex justify-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...riseTransition, delay: 0.15 }}
        >
          {footer}
        </motion.div>
      ) : null}
    </motion.div>
  )
}
