import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { FolderOpen } from 'lucide-react'

import { FilePreviewDialog } from '#/components/files/file-preview-dialog'
import { FileThumbnail } from '#/components/files/file-thumbnail'
import { useImagePreviews } from '#/components/files/use-image-previews'
import type { DriveFile } from '#/components/files/types'
import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Button } from '#/components/ui/button'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import { EmptyState } from '#/components/ui/empty-state'
import { canInlinePreview } from '#/lib/mime'
import { formatFileSize } from '#/lib/format'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { getAppChrome, listRecentFiles } from '#/server/functions/drive'

export const Route = createFileRoute('/recent')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, recent] = await Promise.all([
      getAppChrome(),
      listRecentFiles(),
    ])
    return { chrome, recent }
  },
  head: () => privateAppHead('Nedávne', '/recent'),
  component: RecentPage,
})

type RecentFile = Awaited<ReturnType<typeof listRecentFiles>>[number]

const columnHelper = createDataTableColumnHelper<RecentFile>()

function RecentPage() {
  const { chrome, recent } = Route.useLoaderData()
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const previewUrls = useImagePreviews(recent, recent.length > 0)

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Názov',
          cell: ({ row }) => {
            const file = row.original
            const previewable = canInlinePreview(file.mimeType, file.name)
            const content = (
              <>
                <FileThumbnail
                  name={file.name}
                  mimeType={file.mimeType}
                  previewUrl={previewUrls[file.id]}
                  size="sm"
                />
                <span className="truncate">{file.name}</span>
              </>
            )

            if (!previewable) {
              return (
                <span className="inline-flex max-w-full items-center gap-2 font-medium">
                  {content}
                </span>
              )
            }

            return (
              <button
                type="button"
                className="inline-flex max-w-full items-center gap-2 text-left font-medium hover:text-primary"
                onClick={() => setPreviewFile(file)}
              >
                {content}
              </button>
            )
          },
          meta: { primary: true },
        }),
        columnHelper.accessor('mimeType', {
          header: 'Typ',
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{getValue()}</span>
          ),
          meta: { hideBelow: 'lg', mobileLabel: 'Typ' },
        }),
        columnHelper.accessor('size', {
          header: 'Veľkosť',
          cell: ({ getValue }) => formatFileSize(getValue()),
          meta: { hideBelow: 'sm', mobileLabel: 'Veľkosť' },
        }),
        columnHelper.accessor('createdAt', {
          header: 'Dátum',
          cell: ({ getValue }) =>
            new Date(getValue()).toLocaleString('sk-SK'),
          meta: { hideBelow: 'md', mobileLabel: 'Dátum' },
        }),
        columnHelper.accessor('folderId', {
          id: 'location',
          header: 'Umiestnenie',
          cell: ({ getValue }) => {
            const folderId = getValue()
            return folderId ? (
              <Link
                to="/files/$folderId"
                params={{ folderId }}
                className="text-primary underline-offset-4 hover:underline"
              >
                Otvoriť priečinok
              </Link>
            ) : (
              <Link
                to="/files"
                className="text-primary underline-offset-4 hover:underline"
              >
                Súbory
              </Link>
            )
          },
          meta: { hideBelow: 'md', mobileLabel: 'Umiestnenie' },
        }),
      ]),
    [previewUrls],
  )

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Nedávne"
      subtitle="Posledných 40 nahratých súborov"
    >
      <FadeIn>
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
          {recent.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Zatiaľ prázdne"
              description="Po prvom uploade sa tu zobrazia najnovšie súbory."
              action={
                <Button asChild>
                  <Link to="/files">Prejsť do súborov</Link>
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={recent}
              getRowId={(row) => row.id}
            />
          )}
        </section>
      </FadeIn>

      <FilePreviewDialog
        open={previewFile !== null}
        file={previewFile}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null)
        }}
      />
    </AppShell>
  )
}
