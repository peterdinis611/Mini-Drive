import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Download, FileText, Link2Off, ShieldAlert } from 'lucide-react'

import {
  SharePasswordGate,
  type UnlockedShare,
} from '#/components/files/share-password-gate'
import { EmbedPdfViewer } from '#/components/files/previews/embed-pdf-viewer'
import { Button } from '#/components/ui/button'
import { Image } from '#/components/ui/image'
import { APP_NAME } from '#/lib/constants'
import { getFileKind } from '#/lib/file-kind'
import { isImageMimeType, isPdfMimeType } from '#/lib/mime'
import { formatFileSize } from '#/lib/format'
import { buildSeoHead } from '#/lib/seo'
import { resolvePublicShare } from '#/server/functions/shares'

export const Route = createFileRoute('/e/$token')({
  loader: async ({ params }) =>
    resolvePublicShare({ data: { token: params.token } }),
  head: ({ loaderData, params }) => {
    const fileName =
      loaderData && 'fileName' in loaderData ? loaderData.fileName : undefined
    return buildSeoHead({
      title: fileName ? `Embed: ${fileName}` : 'Embed náhľad',
      description: `Vnorený náhľad súboru v ${APP_NAME}.`,
      path: `/e/${params.token}`,
      noIndex: true,
    })
  },
  component: EmbedSharePage,
})

function EmbedSharePage() {
  const data = Route.useLoaderData()
  const { token } = Route.useParams()
  const [unlocked, setUnlocked] = useState<UnlockedShare | null>(null)

  if (!data) return null

  if (data.status === 'rate_limited') {
    return <EmbedError icon={ShieldAlert} title="Príliš veľa požiadaviek" />
  }
  if (data.status === 'gone') {
    return (
      <EmbedError
        icon={Link2Off}
        title={
          data.reason === 'expired'
            ? 'Odkaz vypršal'
            : data.reason === 'revoked'
              ? 'Odkaz bol zrušený'
              : 'Súbor sa nenašiel'
        }
      />
    )
  }

  if (data.status === 'password_required' && !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <SharePasswordGate
          token={token}
          fileName={data.fileName}
          compact
          onUnlocked={setUnlocked}
        />
      </div>
    )
  }

  const share =
    unlocked ??
    (data.status === 'ok'
      ? {
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          signedUrlExpiresIn: data.signedUrlExpiresIn,
        }
      : null)

  if (!share) {
    return <EmbedError icon={Link2Off} title="Súbor sa nenašiel" />
  }

  const kind = getFileKind(share.mimeType, share.fileName)
  const isImage = isImageMimeType(share.mimeType, share.fileName)
  const isPdf = isPdfMimeType(share.mimeType, share.fileName) || kind === 'pdf'
  const isOffice =
    kind === 'spreadsheet' ||
    kind === 'office' ||
    /\.(docx?|pptx?|xlsx?)$/i.test(share.fileName) ||
    share.mimeType.includes('officedocument') ||
    share.mimeType.includes('msword') ||
    share.mimeType.includes('ms-excel') ||
    share.mimeType.includes('ms-powerpoint')

  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(share.url)}`

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{share.fileName}</p>
          <p className="font-meta text-[11px] text-muted-foreground">
            {formatFileSize(share.fileSize)} · {APP_NAME} embed
            {isPdf ? ' · EmbedPDF' : ''}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={share.url} download={share.fileName} rel="noopener">
            <Download className="size-3.5" />
            Stiahnuť
          </a>
        </Button>
      </header>
      <main className="relative min-h-0 flex-1">
        {isImage ? (
          <div className="relative mx-auto h-[calc(100vh-3.5rem)] w-full max-w-full">
            <Image
              src={share.url}
              alt={share.fileName}
              fill
              priority
              sizes="100vw"
              objectFit="contain"
              unoptimized
            />
          </div>
        ) : isPdf ? (
          <div className="absolute inset-0">
            <EmbedPdfViewer
              url={share.url}
              fileName={share.fileName}
              theme="system"
              embedMode
              className="h-full rounded-none border-0"
            />
          </div>
        ) : isOffice ? (
          <iframe
            title={share.fileName}
            src={officeSrc}
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tento typ súboru nemá inline embed — stiahni ho.
            </p>
            <Button asChild>
              <a href={share.url} download={share.fileName} rel="noopener">
                Stiahnuť súbor
              </a>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function EmbedError({
  icon: Icon,
  title,
}: {
  icon: typeof Link2Off
  title: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
    </div>
  )
}
