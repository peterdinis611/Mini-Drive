import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTransition } from 'react'
import { ArchiveRestore, Loader2, Trash2 } from 'lucide-react'
import { toast } from '#/lib/toast'

import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { privateAppHead } from '#/lib/seo'
import { requireOnboardedSession } from '#/lib/route-guards'
import { getAppChrome } from '#/server/functions/drive'
import {
  emptyTrash,
  listTrash,
  purgeFile,
  purgeFolder,
  restoreFile,
  restoreFolder,
} from '#/server/functions/trash'

export const Route = createFileRoute('/trash')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, trash] = await Promise.all([getAppChrome(), listTrash()])
    return { chrome, trash }
  },
  head: () => privateAppHead('Kôš', '/trash'),
  component: TrashPage,
})

type TrashRow =
  | {
      kind: 'file'
      id: string
      name: string
      size: number
      mimeType: string
      deletedAt: Date | null
    }
  | {
      kind: 'folder'
      id: string
      name: string
      deletedAt: Date | null
    }

const columnHelper = createDataTableColumnHelper<TrashRow>()

function TrashPage() {
  const { chrome, trash } = Route.useLoaderData()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const rows: TrashRow[] = [
    ...trash.folders.map((folder) => ({
      kind: 'folder' as const,
      id: folder.id,
      name: folder.name,
      deletedAt: folder.deletedAt,
    })),
    ...trash.files.map((file) => ({
      kind: 'file' as const,
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      deletedAt: file.deletedAt,
    })),
  ]

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
        void router.invalidate()
      } catch (error) {
        toast.error(getErrorMessage(error, 'Operácia zlyhala'))
      }
    })
  }

  const columns = columnHelper.columns([
    columnHelper.display({
      id: 'name',
      header: 'Názov',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.kind === 'folder' ? '📁 ' : ''}
          {row.original.name}
        </span>
      ),
      meta: { primary: true },
    }),
    columnHelper.display({
      id: 'type',
      header: 'Typ',
      cell: ({ row }) =>
        row.original.kind === 'folder'
          ? 'priečinok'
          : row.original.mimeType || 'súbor',
      meta: { hideBelow: 'md', mobileLabel: 'Typ' },
    }),
    columnHelper.display({
      id: 'size',
      header: 'Veľkosť',
      cell: ({ row }) =>
        row.original.kind === 'file'
          ? formatFileSize(row.original.size)
          : '—',
      meta: { hideBelow: 'sm', mobileLabel: 'Veľkosť' },
    }),
    columnHelper.display({
      id: 'deleted',
      header: 'Zmazané',
      cell: ({ row }) =>
        row.original.deletedAt
          ? new Date(row.original.deletedAt).toLocaleString('sk-SK')
          : '—',
      meta: { hideBelow: 'lg', mobileLabel: 'Zmazané' },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    item.kind === 'file'
                      ? restoreFile({ data: { fileId: item.id } })
                      : restoreFolder({ data: { folderId: item.id } }),
                  'Obnovené',
                )
              }
            >
              <ArchiveRestore />
              Obnoviť
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    item.kind === 'file'
                      ? purgeFile({ data: { fileId: item.id } })
                      : purgeFolder({ data: { folderId: item.id } }),
                  'Natrvalo zmazané',
                )
              }
            >
              <Trash2 />
              Zmazať
            </Button>
          </div>
        )
      },
      meta: {
        actions: true,
        headerClassName: 'text-right',
        cellClassName: 'text-right',
      },
    }),
  ])

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Kôš"
      subtitle={`Položky sa majú ${trash.retentionDays} dní · potom sa dajú natrvalo zmazať`}
      actions={
        rows.length > 0 ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              run(() => emptyTrash(), 'Kôš vyprázdnený')
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Vyprázdniť kôš
          </Button>
        ) : null
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Kôš je prázdny"
          description="Zmazané súbory a priečinky sa zobrazia tu. Môžeš ich obnoviť alebo natrvalo odstrániť."
        />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </AppShell>
  )
}
