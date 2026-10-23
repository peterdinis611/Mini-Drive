import { useCallback, useMemo, useState, useTransition } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import {
  Download,
  Eye,
  Folder,
  FolderPlus,
  Grid2X2,
  List,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  FolderInput,
  Upload,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { toast } from '#/lib/toast'

import { UploadZone } from '#/components/files/upload-zone'
import { NameDialog } from '#/components/files/name-dialog'
import { MoveDialog } from '#/components/files/move-dialog'
import { DeleteFolderDialog } from '#/components/files/delete-folder-dialog'
import { ShareDialog } from '#/components/files/share-dialog'
import { DriveSearchDialog } from '#/components/files/drive-search-dialog'
import { FileThumbnail } from '#/components/files/file-thumbnail'
import { FilePreviewDialog } from '#/components/files/file-preview-dialog'
import { FolderDropTarget } from '#/components/files/folder-drop-target'
import { useDriveUpload } from '#/components/files/use-drive-upload'
import { useImagePreviews } from '#/components/files/use-image-previews'
import { canInlinePreview } from '#/lib/mime'
import { FadeIn } from '#/components/motion/fade-in'
import { Stagger, StaggerItem } from '#/components/motion/stagger'
import { riseTransition } from '#/lib/motion'
import { AppShell } from '#/components/layout/app-shell'
import type { DriveStats } from '#/components/layout/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import {
  deleteFile,
  getFileDownloadUrl,
  moveFile,
  renameFile,
} from '#/server/functions/files'
import {
  createFolder,
  deleteFolder,
  moveFolder,
  renameFolder,
} from '#/server/functions/folders'
import type {
  BreadcrumbItem as Crumb,
  DriveFile,
  DriveFolder,
  FolderTreeNode,
} from './types'

type Props = {
  folderId: string | null
  userName: string
  userEmail?: string
  stats: DriveStats
  initial: {
    folders: DriveFolder[]
    files: DriveFile[]
    breadcrumbs: Crumb[]
    allFolders: FolderTreeNode[]
    viewPreference: 'grid' | 'list'
  }
}

type DialogState =
  | { type: 'create-folder' }
  | { type: 'rename-folder'; folder: DriveFolder }
  | { type: 'rename-file'; file: DriveFile }
  | { type: 'move-file'; file: DriveFile }
  | { type: 'move-folder'; folder: DriveFolder }
  | { type: 'delete-folder'; folder: DriveFolder }
  | { type: 'share-file'; file: DriveFile }
  | { type: 'preview-file'; file: DriveFile }
  | null

type DriveListItem =
  | { kind: 'folder'; id: string; folder: DriveFolder }
  | { kind: 'file'; id: string; file: DriveFile }

const listColumnHelper = createDataTableColumnHelper<DriveListItem>()

export function FileExplorer({
  folderId,
  userName,
  userEmail,
  stats,
  initial,
}: Props) {
  const router = useRouter()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [view, setView] = useState<'grid' | 'list'>(initial.viewPreference)
  const [showUpload, setShowUpload] = useState(true)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pending, startTransition] = useTransition()
  const previewUrls = useImagePreviews(initial.files, true)

  const folders = initial.folders
  const files = initial.files
  const empty = folders.length === 0 && files.length === 0

  const listItems = useMemo<DriveListItem[]>(
    () => [
      ...folders.map(
        (folder): DriveListItem => ({
          kind: 'folder',
          id: `folder-${folder.id}`,
          folder,
        }),
      ),
      ...files.map(
        (file): DriveListItem => ({
          kind: 'file',
          id: `file-${file.id}`,
          file,
        }),
      ),
    ],
    [folders, files],
  )

  const excludeForFolderMove = useMemo(() => {
    if (dialog?.type !== 'move-folder') return []
    return [dialog.folder.id]
  }, [dialog])

  function refresh() {
    void router.invalidate()
  }

  const { uploadFiles, isUploading, percent, queue } = useDriveUpload({
    onComplete: (destFolderId) => {
      refresh()
      if (destFolderId === folderId) return
      if (destFolderId) {
        void navigate({
          to: '/files/$folderId',
          params: { folderId: destFolderId },
        })
      } else {
        void navigate({ to: '/files' })
      }
    },
  })

  const handleUpload = useCallback(
    (incoming: File[] | FileList | null, dest: string | null) => {
      setShowUpload(true)
      void uploadFiles(incoming, dest)
    },
    [uploadFiles],
  )

  const run = useCallback(
    (action: () => Promise<unknown>, success: string) => {
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            await action()
            toast.success(success)
            setDialog(null)
            refresh()
            resolve()
          } catch (error) {
            toast.error(getErrorMessage(error, 'Operácia zlyhala'))
            reject(error)
          }
        })
      })
    },
    [router],
  )

  const listColumns = useMemo(
    () =>
      listColumnHelper.columns([
        listColumnHelper.display({
          id: 'name',
          header: 'Názov',
          cell: ({ row }) => {
            const item = row.original
            if (item.kind === 'folder') {
              const folder = item.folder
              return (
                <FolderDropTarget
                  folderId={folder.id}
                  folderName={folder.name}
                  disabled={isUploading}
                  onDropFiles={(dropped, dest) => handleUpload(dropped, dest)}
                >
                  <Link
                    to="/files/$folderId"
                    params={{ folderId: folder.id }}
                    className="inline-flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <Folder className="size-4 text-primary" />
                    {folder.name}
                  </Link>
                </FolderDropTarget>
              )
            }

            const file = item.file
            return (
              <button
                type="button"
                className="inline-flex max-w-full items-center gap-2 text-left font-medium hover:text-primary"
                onClick={() => setDialog({ type: 'preview-file', file })}
              >
                <FileThumbnail
                  name={file.name}
                  mimeType={file.mimeType}
                  previewUrl={previewUrls[file.id]}
                  size="sm"
                />
                <span className="truncate">{file.name}</span>
              </button>
            )
          },
          meta: { primary: true },
        }),
        listColumnHelper.display({
          id: 'type',
          header: 'Typ',
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.kind === 'folder'
                ? 'priečinok'
                : row.original.file.mimeType || '—'}
            </span>
          ),
          meta: { hideBelow: 'lg', mobileLabel: 'Typ' },
        }),
        listColumnHelper.display({
          id: 'size',
          header: 'Veľkosť',
          cell: ({ row }) =>
            row.original.kind === 'folder'
              ? '—'
              : formatFileSize(row.original.file.size),
          meta: { hideBelow: 'sm', mobileLabel: 'Veľkosť' },
        }),
        listColumnHelper.display({
          id: 'date',
          header: 'Dátum',
          cell: ({ row }) =>
            formatDate(
              row.original.kind === 'folder'
                ? row.original.folder.createdAt
                : row.original.file.createdAt,
            ),
          meta: { hideBelow: 'md', mobileLabel: 'Dátum' },
        }),
        listColumnHelper.display({
          id: 'actions',
          header: 'Akcie',
          cell: ({ row }) => {
            if (row.original.kind === 'folder') {
              const folder = row.original.folder
              return (
                <FolderActions
                  onRename={() => setDialog({ type: 'rename-folder', folder })}
                  onMove={() => setDialog({ type: 'move-folder', folder })}
                  onDelete={() => setDialog({ type: 'delete-folder', folder })}
                />
              )
            }

            const file = row.original.file
            return (
              <FileActions
                canPreview={canInlinePreview(file.mimeType, file.name)}
                onPreview={() => setDialog({ type: 'preview-file', file })}
                onRename={() => setDialog({ type: 'rename-file', file })}
                onMove={() => setDialog({ type: 'move-file', file })}
                onDownload={() =>
                  run(async () => {
                    const result = await getFileDownloadUrl({
                      data: { fileId: file.id },
                    })
                    window.open(result.url, '_blank', 'noopener,noreferrer')
                  }, 'Odkaz na stiahnutie pripravený')
                }
                onDelete={() =>
                  run(
                    () => deleteFile({ data: { fileId: file.id } }),
                    'Súbor zmazaný',
                  )
                }
                onShare={() => setDialog({ type: 'share-file', file })}
              />
            )
          },
          meta: {
            actions: true,
            headerClassName: 'w-12 text-right',
            cellClassName: 'text-right',
          },
        }),
      ]),
    [handleUpload, isUploading, previewUrls, run],
  )

  const currentName =
    initial.breadcrumbs[initial.breadcrumbs.length - 1]?.name ?? 'Súbory'

  return (
    <DndProvider backend={HTML5Backend}>
    <AppShell
      userName={userName}
      userEmail={userEmail}
      folders={initial.allFolders}
      activeFolderId={folderId}
      stats={stats}
      title={currentName}
      subtitle={`${folders.length} priečinkov · ${files.length} súborov`}
      actions={
        <>
          <DriveSearchDialog />
          <div className="flex overflow-hidden rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={view === 'list' ? 'bg-accent' : ''}
              aria-label="Zoznam"
              onClick={() => setView('list')}
            >
              <List />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={view === 'grid' ? 'bg-accent' : ''}
              aria-label="Mriežka"
              onClick={() => setView('grid')}
            >
              <Grid2X2 />
            </Button>
          </div>
          <Button
            type="button"
            variant={showUpload ? 'secondary' : 'outline'}
            onClick={() => setShowUpload((v) => !v)}
            aria-pressed={showUpload}
          >
            <Upload />
            {showUpload ? 'Skryť upload' : 'Nahrať'}
          </Button>
          <Button
            type="button"
            onClick={() => setDialog({ type: 'create-folder' })}
          >
            <FolderPlus />
            Nový priečinok
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="sm:hidden">
          <DriveSearchDialog compact />
        </div>

        <FadeIn>
          <nav aria-label="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                {initial.breadcrumbs.map((crumb, index) => {
                  const isLast = index === initial.breadcrumbs.length - 1
                  return (
                    <BreadcrumbItem key={crumb.id ?? 'root'}>
                      {index > 0 ? <BreadcrumbSeparator /> : null}
                      {isLast ? (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      ) : crumb.id ? (
                        <BreadcrumbLink asChild>
                          <Link
                            to="/files/$folderId"
                            params={{ folderId: crumb.id }}
                          >
                            {crumb.name}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to="/files">{crumb.name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </nav>
        </FadeIn>

        <AnimatePresence initial={false}>
          {showUpload ? (
            <motion.div
              key="upload"
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduce ? undefined : { opacity: 0, height: 0 }}
              transition={riseTransition}
            >
              <UploadZone
                folderId={folderId}
                folders={initial.allFolders}
                isUploading={isUploading}
                percent={percent}
                queue={queue}
                onUpload={handleUpload}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <FadeIn delay={0.06}>
          {pending ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : empty ? (
            <EmptyState
              icon={Folder}
              title="Zatiaľ prázdne"
              description="Nahraj súbor alebo vytvor nový priečinok. Hľadaj cez ⌘K."
              className="rounded-2xl border border-dashed border-border/80 bg-muted/20"
            />
          ) : view === 'list' ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
              <DataTable
                columns={listColumns}
                data={listItems}
                getRowId={(row) => row.id}
              />
            </div>
          ) : (
            <Stagger
              key="grid"
              className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3"
            >
              {folders.map((folder) => (
                <StaggerItem key={folder.id}>
                  <FolderDropTarget
                    folderId={folder.id}
                    folderName={folder.name}
                    disabled={isUploading}
                    onDropFiles={(dropped, dest) =>
                      handleUpload(dropped, dest)
                    }
                  >
                    <motion.div
                      className="group relative rounded-md px-3 py-3 hover:bg-muted/70"
                      whileHover={reduce ? undefined : { y: -1 }}
                      transition={riseTransition}
                    >
                      <Link
                        to="/files/$folderId"
                        params={{ folderId: folder.id }}
                        className="flex items-start gap-3"
                      >
                        <Folder className="mt-0.5 size-5 text-primary" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            priečinok · pusti sem súbory
                          </p>
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <FolderActions
                          onRename={() =>
                            setDialog({ type: 'rename-folder', folder })
                          }
                          onMove={() =>
                            setDialog({ type: 'move-folder', folder })
                          }
                          onDelete={() =>
                            setDialog({ type: 'delete-folder', folder })
                          }
                        />
                      </div>
                    </motion.div>
                  </FolderDropTarget>
                </StaggerItem>
              ))}
              {files.map((file) => (
                <StaggerItem key={file.id}>
                  <motion.div
                    className="group relative rounded-md px-3 py-3 hover:bg-muted/70"
                    whileHover={reduce ? undefined : { y: -1 }}
                    transition={riseTransition}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 text-left"
                      onClick={() =>
                        setDialog({ type: 'preview-file', file })
                      }
                    >
                      <FileThumbnail
                        name={file.name}
                        mimeType={file.mimeType}
                        previewUrl={previewUrls[file.id]}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} ·{' '}
                          {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </button>
                    <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <FileActions
                        canPreview={canInlinePreview(file.mimeType, file.name)}
                        onPreview={() =>
                          setDialog({ type: 'preview-file', file })
                        }
                        onRename={() =>
                          setDialog({ type: 'rename-file', file })
                        }
                        onMove={() => setDialog({ type: 'move-file', file })}
                        onDownload={() =>
                          run(async () => {
                            const result = await getFileDownloadUrl({
                              data: { fileId: file.id },
                            })
                            window.open(
                              result.url,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }, 'Odkaz na stiahnutie pripravený')
                        }
                        onDelete={() =>
                          run(
                            () => deleteFile({ data: { fileId: file.id } }),
                            'Súbor zmazaný',
                          )
                        }
                        onShare={() =>
                          setDialog({ type: 'share-file', file })
                        }
                      />
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </FadeIn>
      </div>

      <NameDialog
        open={dialog?.type === 'create-folder'}
        title="Nový priečinok"
        confirmLabel="Vytvoriť"
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(name) =>
          run(
            () => createFolder({ data: { name, parentId: folderId } }),
            'Priečinok vytvorený',
          )
        }
      />

      <NameDialog
        open={dialog?.type === 'rename-folder'}
        title="Premenovať priečinok"
        initialValue={
          dialog?.type === 'rename-folder' ? dialog.folder.name : ''
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.type !== 'rename-folder') return
          return run(
            () =>
              renameFolder({
                data: { folderId: dialog.folder.id, name },
              }),
            'Priečinok premenovaný',
          )
        }}
      />

      <NameDialog
        open={dialog?.type === 'rename-file'}
        title="Premenovať súbor"
        initialValue={dialog?.type === 'rename-file' ? dialog.file.name : ''}
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.type !== 'rename-file') return
          return run(
            () => renameFile({ data: { fileId: dialog.file.id, name } }),
            'Súbor premenovaný',
          )
        }}
      />

      <MoveDialog
        open={dialog?.type === 'move-file'}
        title="Presunúť súbor"
        folders={initial.allFolders}
        initialFolderId={
          dialog?.type === 'move-file' ? dialog.file.folderId : null
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(targetFolderId) => {
          if (dialog?.type !== 'move-file') return
          return run(
            () =>
              moveFile({
                data: { fileId: dialog.file.id, folderId: targetFolderId },
              }),
            'Súbor presunutý',
          )
        }}
      />

      <MoveDialog
        open={dialog?.type === 'move-folder'}
        title="Presunúť priečinok"
        folders={initial.allFolders}
        excludeFolderIds={excludeForFolderMove}
        initialFolderId={
          dialog?.type === 'move-folder' ? dialog.folder.parentId : null
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(newParentId) => {
          if (dialog?.type !== 'move-folder') return
          return run(
            () =>
              moveFolder({
                data: { folderId: dialog.folder.id, newParentId },
              }),
            'Priečinok presunutý',
          )
        }}
      />

      <DeleteFolderDialog
        open={dialog?.type === 'delete-folder'}
        folderId={dialog?.type === 'delete-folder' ? dialog.folder.id : null}
        folderName={
          dialog?.type === 'delete-folder' ? dialog.folder.name : ''
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => {
          if (dialog?.type !== 'delete-folder') return
          return run(
            () => deleteFolder({ data: { folderId: dialog.folder.id } }),
            'Priečinok zmazaný',
          )
        }}
      />

      <ShareDialog
        open={dialog?.type === 'share-file'}
        fileId={dialog?.type === 'share-file' ? dialog.file.id : null}
        fileName={dialog?.type === 'share-file' ? dialog.file.name : ''}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <FilePreviewDialog
        open={dialog?.type === 'preview-file'}
        file={dialog?.type === 'preview-file' ? dialog.file : null}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </AppShell>
    </DndProvider>
  )
}

function FolderActions({
  onRename,
  onMove,
  onDelete,
}: {
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Akcie priečinka"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}>
          <Pencil /> Premenovať
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <FolderInput /> Presunúť
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 /> Zmazať
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FileActions({
  canPreview = false,
  onPreview,
  onRename,
  onMove,
  onDownload,
  onDelete,
  onShare,
}: {
  canPreview?: boolean
  onPreview?: () => void
  onRename: () => void
  onMove: () => void
  onDownload: () => void
  onDelete: () => void
  onShare: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Akcie súboru"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canPreview && onPreview ? (
          <DropdownMenuItem onClick={onPreview}>
            <Eye /> Náhľad
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={onRename}>
          <Pencil /> Premenovať
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <FolderInput /> Presunúť
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <Download /> Stiahnuť
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare}>
          <Share2 /> Zdieľať
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 /> Zmazať
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatDate(value: Date | string | number | undefined) {
  if (value == null) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
