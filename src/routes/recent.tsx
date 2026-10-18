import { Link, createFileRoute } from '@tanstack/react-router'
import { FileIcon, FolderOpen } from 'lucide-react'

import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Button } from '#/components/ui/button'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import { EmptyState } from '#/components/ui/empty-state'
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

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: 'Názov',
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-2 font-medium">
        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{getValue()}</span>
      </span>
    ),
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
])

function RecentPage() {
  const { chrome, recent } = Route.useLoaderData()

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
              scene="files"
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
    </AppShell>
  )
}
