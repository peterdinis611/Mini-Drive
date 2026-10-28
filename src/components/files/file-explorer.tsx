import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer'
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
  Search,
  Share2,
  Trash2,
  FolderInput,
  Upload,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useQueryStates } from 'nuqs'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { toast } from '#/lib/toast'

import { UploadZone } from '#/components/files/upload-zone'
import { NameDialog } from '#/components/files/name-dialog'
import { MoveDialog } from '#/components/files/move-dialog'
import { DeleteFolderDialog } from '#/components/files/delete-folder-dialog'
import { ShareDialog } from '#/components/files/share-dialog'
import { DriveSearchTrigger } from '#/components/files/drive-search-dialog'
import { FileThumbnail } from '#/components/files/file-thumbnail'
import { FilePreviewDialog } from '#/components/files/file-preview-dialog'
import { FolderDropTarget } from '#/components/files/folder-drop-target'
import { useDriveUpload } from '#/components/files/use-drive-upload'
import { useImagePreviews } from '#/components/files/use-image-previews'
import { canInlinePreview } from '#/lib/mime'
import { filterDriveFiles, filterDriveFolders } from '#/lib/drive-filters'
import { driveSearchParams, viewParser } from '#/lib/drive-url-state'
import {
  consumeQueuedQuickAction,
  onQuickAction,
} from '#/lib/quick-actions'
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
import { Checkbox } from '#/components/ui/checkbox'
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
import { Input } from '#/components/ui/input'
import { SectionLoading } from '#/components/ui/preload-spinner'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { cn } from '#/lib/utils'
import {
  bulkDeleteFiles,
  bulkMoveFiles,
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

const KIND_CHIPS = [
  { value: 'all' as const, label: 'Všetko' },
  { value: 'image' as const, label: 'Obrázky' },
  { value: 'pdf' as const, label: 'PDF' },
  { value: 'video' as const, label: 'Video' },
  { value: 'audio' as const, label: 'Audio' },
  { value: 'text' as const, label: 'Text' },
]

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
    defaultShareExpiresIn?: number
    confirmDelete?: boolean
  }
}

type DialogState =
  | { type: 'create-folder' }
  | { type: 'rename-folder'; folder: DriveFolder }
  | { type: 'rename-file'; file: DriveFile }
  | { type: 'move-file'; file: DriveFile }
  | { type: 'move-folder'; folder: DriveFolder }
  | { type: 'bulk-move' }
  | { type: 'delete-folder'; folder: DriveFolder }
  | { type: 'share-file'; file: DriveFile }
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
  const [{ view, kind, preview, q, upload: showUpload }, setUrlState] =
    useQueryStates({
      ...driveSearchParams,
      view: viewParser.withDefault(initial.viewPreference),
    })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pending, startTransition] = useTransition()
  const previewUrls = useImagePreviews(initial.files, true)
  const [filterDraft, setFilterDraft] = useState(q)
  const [debouncedFilter] = useDebouncedValue(filterDraft, { wait: 220 })

  const folders = initial.folders
  const files = initial.files

  useEffect(() => {
    setFilterDraft(q)
  }, [q, folderId])

  useEffect(() => {
    if (debouncedFilter === q) return
    void setUrlState({ q: debouncedFilter })
  }, [debouncedFilter, q, setUrlState])

  useEffect(() => {
    function applyQuickAction(action: 'upload' | 'create-folder' | 'search') {
      if (action === 'upload') {
        void setUrlState({ upload: true })
        return
      }
      if (action === 'create-folder') {
        setDialog({ type: 'create-folder' })
      }
    }

    const pending = consumeQueuedQuickAction()
    if (pending) applyQuickAction(pending)

    return onQuickAction(applyQuickAction)
  }, [setUrlState])

  const filteredFolders = useMemo(
    () => filterDriveFolders(folders, kind, debouncedFilter),
    [folders, kind, debouncedFilter],
  )

  const filteredFiles = useMemo(
    () => filterDriveFiles(files, kind, debouncedFilter),
    [files, kind, debouncedFilter],
  )

  const empty = filteredFolders.length === 0 && filteredFiles.length === 0

  const previewFile = useMemo(() => {
    if (!preview) return null
    return files.find((file) => file.id === preview) ?? null
  }, [files, preview])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [folderId])

  useEffect(() => {
    if (preview && !previewFile) {
      void setUrlState({ preview: null })
    }
  }, [preview, previewFile, setUrlState])

  const openPreview = useCallback(
    (file: DriveFile) => {
      void setUrlState({ preview: file.id })
    },
    [setUrlState],
  )

  const listItems = useMemo<DriveListItem[]>(
    () => [
      ...filteredFolders.map(
        (folder): DriveListItem => ({
          kind: 'folder',
          id: `folder-${folder.id}`,
          folder,
        }),
      ),
      ...filteredFiles.map(
        (file): DriveListItem => ({
          kind: 'file',
          id: `file-${file.id}`,
          file,
        }),
      ),
    ],
    [filteredFolders, filteredFiles],
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
      void setUrlState({ upload: true })
      void uploadFiles(incoming, dest)
    },
    [setUrlState, uploadFiles],
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

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const toggleFileSelected = useCallback((fileId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(fileId)
      else next.delete(fileId)
      return next
    })
  }, [])

  const confirmTrash = useCallback(
    (message: string) => {
      if (initial.confirmDelete === false) return true
      return window.confirm(message)
    },
    [initial.confirmDelete],
  )

  const handleBulkDelete = useCallback(() => {
    const fileIds = [...selectedIds]
    if (fileIds.length === 0) return
    if (
      !confirmTrash(
        `Presunúť ${fileIds.length} súborov do koša?`,
      )
    ) {
      return
    }
    void run(
      () => bulkDeleteFiles({ data: { fileIds } }),
      'Presunuté do koša',
    ).then(clearSelection)
  }, [clearSelection, confirmTrash, run, selectedIds])

  const handleBulkShare = useCallback(() => {
    if (selectedIds.size !== 1) return
    const fileId = [...selectedIds][0]
    const file = files.find((f) => f.id === fileId)
    if (file) setDialog({ type: 'share-file', file })
  }, [files, selectedIds])

  const allFilteredSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((file) => selectedIds.has(file.id))
  const someFilteredSelected = filteredFiles.some((file) =>
    selectedIds.has(file.id),
  )

  const listColumns = useMemo(
    () =>
      listColumnHelper.columns([
        listColumnHelper.display({
          id: 'select',
          header: () => (
            <Checkbox
              checked={
                allFilteredSelected
                  ? true
                  : someFilteredSelected
                    ? 'indeterminate'
                    : false
              }
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(new Set(filteredFiles.map((f) => f.id)))
                } else {
                  setSelectedIds(new Set())
                }
              }}
              aria-label="Vybrať všetky súbory"
            />
          ),
          cell: ({ row }) => {
            if (row.original.kind === 'folder') return null
            const file = row.original.file
            return (
              <Checkbox
                checked={selectedIds.has(file.id)}
                onCheckedChange={(checked) =>
                  toggleFileSelected(file.id, checked === true)
                }
                aria-label={`Vybrať ${file.name}`}
                onClick={(event) => event.stopPropagation()}
              />
            )
          },
          meta: {
            headerClassName: 'w-10',
            cellClassName: 'w-10',
          },
        }),
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
                onClick={() => openPreview(file)}
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
                onPreview={() => openPreview(file)}
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
                onDelete={() => {
                  if (
                    !confirmTrash(
                      `Presunúť „${file.name}“ do koša?`,
                    )
                  ) {
                    return
                  }
                  void run(
                    () => deleteFile({ data: { fileId: file.id } }),
                    'Presunuté do koša',
                  )
                }}
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
    [
      allFilteredSelected,
      confirmTrash,
      filteredFiles,
      handleUpload,
      isUploading,
      openPreview,
      previewUrls,
      run,
      selectedIds,
      someFilteredSelected,
      toggleFileSelected,
    ],
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
      subtitle={`${filteredFolders.length} priečinkov · ${filteredFiles.length} súborov`}
      actions={
        <>
          <DriveSearchTrigger />
          <div className="flex overflow-hidden rounded-full border-2 border-foreground/80 dark:border-primary/45">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={
                view === 'list'
                  ? 'rounded-none bg-primary text-primary-foreground'
                  : 'rounded-none'
              }
              aria-label="Zoznam"
              onClick={() => void setUrlState({ view: 'list' })}
            >
              <List />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={
                view === 'grid'
                  ? 'rounded-none bg-primary text-primary-foreground'
                  : 'rounded-none'
              }
              aria-label="Mriežka"
              onClick={() => void setUrlState({ view: 'grid' })}
            >
              <Grid2X2 />
            </Button>
          </div>
          <Button
            type="button"
            variant={showUpload ? 'secondary' : 'outline'}
            onClick={() => void setUrlState({ upload: !showUpload })}
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
          <DriveSearchTrigger compact />
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {KIND_CHIPS.map((chip) => (
              <Button
                key={chip.value}
                type="button"
                size="sm"
                variant={kind === chip.value ? 'secondary' : 'ghost'}
                className={cn(
                  'h-8 rounded-md px-2.5 text-xs',
                  kind === chip.value && 'bg-accent',
                )}
                onClick={() => void setUrlState({ kind: chip.value })}
              >
                {chip.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterDraft}
              onChange={(event) => setFilterDraft(event.target.value)}
              placeholder="Filtrovať…"
              className="h-8 pl-8"
              aria-label="Filtrovať súbory a priečinky"
            />
          </div>
        </div>

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
            <SectionLoading label="Obnovujem priečinok…" />
          ) : empty ? (
            <EmptyState
              icon={Folder}
              title="Zatiaľ prázdne"
              description="Nahraj súbor alebo vytvor nový priečinok. Hľadaj cez skratku (predvolene ⌘K)."
              className="rounded-2xl border border-dashed border-border/80 bg-muted/20"
            />
          ) : view === 'list' ? (
            <div className="overflow-hidden rounded-2xl border-2 border-foreground/12 bg-card/60 dark:border-primary/30">
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
              {filteredFolders.map((folder) => (
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
              {filteredFiles.map((file) => (
                <StaggerItem key={file.id}>
                  <motion.div
                    className="group relative rounded-md px-3 py-3 hover:bg-muted/70"
                    whileHover={reduce ? undefined : { y: -1 }}
                    transition={riseTransition}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 text-left"
                      onClick={() => openPreview(file)}
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
                        onPreview={() => openPreview(file)}
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
                        onDelete={() => {
                          if (
                            !confirmTrash(
                              `Presunúť „${file.name}“ do koša?`,
                            )
                          ) {
                            return
                          }
                          void run(
                            () => deleteFile({ data: { fileId: file.id } }),
                            'Presunuté do koša',
                          )
                        }}
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

        {selectedIds.size > 0 ? (
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-full border-2 border-foreground/15 bg-card/95 px-3 py-2 shadow-none backdrop-blur-sm dark:border-primary/35">
            <span className="text-sm font-medium">
              {selectedIds.size} vybraných
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDialog({ type: 'bulk-move' })}
            >
              <FolderInput />
              Presunúť
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
            >
              <Trash2 />
              Zmazať
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={selectedIds.size !== 1}
              onClick={handleBulkShare}
            >
              <Share2 />
              Zdieľať
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={clearSelection}
              aria-label="Zrušiť výber"
            >
              <X />
              Zrušiť
            </Button>
          </div>
        ) : null}
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
            'Presunuté do koša',
          )
        }}
      />

      <MoveDialog
        open={dialog?.type === 'bulk-move'}
        title="Presunúť súbory"
        folders={initial.allFolders}
        initialFolderId={folderId}
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(targetFolderId) => {
          if (dialog?.type !== 'bulk-move') return
          const fileIds = [...selectedIds]
          if (fileIds.length === 0) return
          return run(
            () =>
              bulkMoveFiles({
                data: { fileIds, folderId: targetFolderId },
              }),
            'Súbory presunuté',
          ).then(clearSelection)
        }}
      />

      <ShareDialog
        open={dialog?.type === 'share-file'}
        fileId={dialog?.type === 'share-file' ? dialog.file.id : null}
        fileName={dialog?.type === 'share-file' ? dialog.file.name : ''}
        defaultExpiresIn={initial.defaultShareExpiresIn}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <FilePreviewDialog
        open={Boolean(previewFile)}
        file={previewFile}
        defaultShareExpiresIn={initial.defaultShareExpiresIn}
        onOpenChange={(open) => {
          if (!open) void setUrlState({ preview: null })
        }}
        onSavedToDrive={() => refresh()}
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
