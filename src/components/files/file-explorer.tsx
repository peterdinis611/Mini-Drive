import { useDebouncedValue } from '@tanstack/react-pacer'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import {
  Archive,
  Copy,
  Download,
  Eye,
  FileText,
  Film,
  Folder,
  FolderInput,
  FolderPlus,
  Grid2X2,
  History,
  ImageIcon,
  Layers,
  List,
  type LucideIcon,
  MoreHorizontal,
  Music,
  Pencil,
  Search,
  Share2,
  Star,
  StickyNote,
  Tag,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useQueryStates } from 'nuqs'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { BatchRenameDialog } from '#/components/files/batch-rename-dialog'
import { DeleteFolderDialog } from '#/components/files/delete-folder-dialog'
import { DriveSearchTrigger } from '#/components/files/drive-search-dialog'
import { DuplicatesDialog } from '#/components/files/duplicates-dialog'
import { FileNotesDialog } from '#/components/files/file-notes-dialog'
import { FilePreviewDialog } from '#/components/files/file-preview-dialog'
import { FileTagsDialog } from '#/components/files/file-tags-dialog'
import { FileThumbnail } from '#/components/files/file-thumbnail'
import { FileVersionsDialog } from '#/components/files/file-versions-dialog'
import { FolderDropTarget } from '#/components/files/folder-drop-target'
import { FolderStyleDialog } from '#/components/files/folder-style-dialog'
import { MoveDialog } from '#/components/files/move-dialog'
import { NameDialog } from '#/components/files/name-dialog'
import { ShareDialog } from '#/components/files/share-dialog'
import {
  type UploadConflict,
  UploadConflictDialog,
  uniqueKeepBothName,
} from '#/components/files/upload-conflict-dialog'
import { UploadZone } from '#/components/files/upload-zone'
import { useDriveUpload } from '#/components/files/use-drive-upload'
import { useImagePreviews } from '#/components/files/use-image-previews'
import { AppShell } from '#/components/layout/app-shell'
import type { DriveStats } from '#/components/layout/app-sidebar'
import { FadeIn } from '#/components/motion/fade-in'
import { Stagger, StaggerItem } from '#/components/motion/stagger'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Button } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import { Checkbox } from '#/components/ui/checkbox'
import {
  createDataTableColumnHelper,
  DataTable,
} from '#/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { EmptyState } from '#/components/ui/empty-state'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { SectionLoading } from '#/components/ui/preload-spinner'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { filterDriveFiles, filterDriveFolders } from '#/lib/drive-filters'
import { driveSearchParams, viewParser } from '#/lib/drive-url-state'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { canInlinePreview } from '#/lib/mime'
import { riseTransition } from '#/lib/motion'
import { consumeQueuedQuickAction, onQuickAction } from '#/lib/quick-actions'
import { toast } from '#/lib/toast'
import { toggleFavorite } from '#/server/functions/favorites'
import {
  bulkDeleteFiles,
  bulkMoveFiles,
  bulkRenameFiles,
  checkUploadConflicts,
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
  setLastFolder,
  updateFolderStyle,
} from '#/server/functions/folders'
import { downloadFolderZip, getBulkDownloadUrls } from '#/server/functions/zip'
import type {
  BreadcrumbItem as Crumb,
  DriveFile,
  DriveFolder,
  FolderTreeNode,
} from './types'

const KIND_CHIPS: Array<{
  value: 'all' | 'image' | 'pdf' | 'video' | 'audio' | 'text'
  label: string
  icon: LucideIcon
}> = [
  { value: 'all', label: 'Všetko', icon: Layers },
  { value: 'image', label: 'Obrázky', icon: ImageIcon },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'video', label: 'Video', icon: Film },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'text', label: 'Text', icon: Type },
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
  | { type: 'versions'; file: DriveFile }
  | { type: 'tags'; file: DriveFile }
  | { type: 'notes'; file: DriveFile }
  | { type: 'batch-rename' }
  | { type: 'folder-style'; folder: DriveFolder }
  | { type: 'duplicates' }
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
  const [uploadConflicts, setUploadConflicts] = useState<UploadConflict[]>([])
  const [pendingUpload, setPendingUpload] = useState<{
    files: File[]
    dest: string | null
  } | null>(null)
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
    void setLastFolder({ data: { folderId } }).catch(() => {
      // best-effort resume pointer
    })
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
      const list = incoming
        ? Array.from(incoming instanceof FileList ? incoming : incoming)
        : []
      if (list.length === 0) return

      void checkUploadConflicts({
        data: { folderId: dest, names: list.map((file) => file.name) },
      })
        .then((conflicts) => {
          if (conflicts.length === 0) {
            void uploadFiles(list, dest)
            return
          }
          setPendingUpload({ files: list, dest })
          setUploadConflicts(conflicts)
        })
        .catch(() => {
          void uploadFiles(list, dest)
        })
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
    if (!confirmTrash(`Presunúť ${fileIds.length} súborov do koša?`)) {
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

  const handleBulkDownload = useCallback(() => {
    const fileIds = [...selectedIds]
    if (fileIds.length === 0) return
    void run(
      async () => {
        const items = await getBulkDownloadUrls({ data: { fileIds } })
        for (const item of items) {
          const anchor = document.createElement('a')
          anchor.href = item.url
          anchor.download = item.name
          anchor.rel = 'noopener'
          anchor.target = '_blank'
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
        }
      },
      fileIds.length === 1
        ? 'Sťahovanie pripravené'
        : `${fileIds.length} súborov`,
    )
  }, [run, selectedIds])

  const handleToggleFavorite = useCallback(
    (targetType: 'file' | 'folder', targetId: string) => {
      void run(
        () => toggleFavorite({ data: { targetType, targetId } }),
        'Obľúbené aktualizované',
      )
    },
    [run],
  )

  const handleFolderZip = useCallback(
    (folder: DriveFolder) => {
      void run(async () => {
        const result = await downloadFolderZip({
          data: { folderId: folder.id },
        })
        const binary = atob(result.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = result.name
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
      }, `Zip (${folder.name}) pripravený`)
    },
    [run],
  )

  const dragUrlCache = useRef(
    new Map<string, { url: string; mimeType: string; name: string }>(),
  )

  const prefetchDragUrl = useCallback((file: DriveFile) => {
    if (dragUrlCache.current.has(file.id)) return
    void getFileDownloadUrl({ data: { fileId: file.id } })
      .then((result) => {
        dragUrlCache.current.set(file.id, {
          url: result.url,
          mimeType: file.mimeType,
          name: file.name,
        })
      })
      .catch(() => {
        // ignore — drag-out falls back to text/plain
      })
  }, [])

  const handleFileDragStart = useCallback(
    (event: React.DragEvent, file: DriveFile) => {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', file.name)
      const cached = dragUrlCache.current.get(file.id)
      if (cached) {
        try {
          event.dataTransfer.setData(
            'DownloadURL',
            `${cached.mimeType}:${cached.name}:${cached.url}`,
          )
        } catch {
          // DownloadURL not supported in all browsers
        }
      }
    },
    [],
  )

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
                  onZip={() => handleFolderZip(folder)}
                  onFavorite={() => handleToggleFavorite('folder', folder.id)}
                  onStyle={() => setDialog({ type: 'folder-style', folder })}
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
                  if (!confirmTrash(`Presunúť „${file.name}“ do koša?`)) {
                    return
                  }
                  void run(
                    () => deleteFile({ data: { fileId: file.id } }),
                    'Presunuté do koša',
                  )
                }}
                onShare={() => setDialog({ type: 'share-file', file })}
                onVersions={() => setDialog({ type: 'versions', file })}
                onTags={() => setDialog({ type: 'tags', file })}
                onNotes={() => setDialog({ type: 'notes', file })}
                onFavorite={() => handleToggleFavorite('file', file.id)}
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
      handleFolderZip,
      handleToggleFavorite,
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
            <ButtonGroup className="rounded-full border-2 border-foreground/80 dark:border-primary/45">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => {
                  if (value === 'list' || value === 'grid') {
                    void setUrlState({ view: value })
                  }
                }}
                className="gap-0"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="list"
                      aria-label="Zoznam"
                      className="rounded-none first:rounded-l-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <List />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Zoznam</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="grid"
                      aria-label="Mriežka"
                      className="rounded-none last:rounded-r-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Grid2X2 />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Mriežka</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </ButtonGroup>
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
              variant="outline"
              onClick={() => setDialog({ type: 'duplicates' })}
            >
              <Copy />
              Duplikáty
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
            <div
              role="group"
              aria-label="Filter podľa typu"
              className="inline-flex max-w-full overflow-x-auto rounded-full border border-border/80 bg-muted/55 p-1 shadow-[inset_0_1px_0_color-mix(in_oklab,white_55%,transparent)] dark:border-primary/25 dark:bg-muted/40 dark:shadow-none"
            >
              <ToggleGroup
                type="single"
                value={kind}
                onValueChange={(value) => {
                  if (
                    value === 'all' ||
                    value === 'image' ||
                    value === 'pdf' ||
                    value === 'video' ||
                    value === 'audio' ||
                    value === 'text'
                  ) {
                    void setUrlState({ kind: value })
                  }
                }}
                size="sm"
                spacing={0}
                className="gap-0.5"
              >
                {KIND_CHIPS.map((chip) => {
                  const Icon = chip.icon
                  return (
                    <ToggleGroupItem
                      key={chip.value}
                      value={chip.value}
                      aria-label={chip.label}
                      className="h-8 gap-1.5 rounded-full border-0 px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-[color,background-color,box-shadow,transform] hover:bg-background/70 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:ring-1 data-[state=on]:ring-border/70 dark:data-[state=on]:bg-card dark:data-[state=on]:text-primary dark:data-[state=on]:ring-primary/30 sm:px-3"
                    >
                      <Icon className="size-3.5 opacity-80" aria-hidden />
                      <span>{chip.label}</span>
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </div>
            <InputGroup className="h-9 w-full rounded-full sm:max-w-56">
              <InputGroupAddon>
                <Search className="size-3.5" aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                value={filterDraft}
                onChange={(event) => setFilterDraft(event.target.value)}
                placeholder="Filtrovať…"
                aria-label="Filtrovať súbory a priečinky"
                className="rounded-full"
              />
            </InputGroup>
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
                            onZip={() => handleFolderZip(folder)}
                            onFavorite={() =>
                              handleToggleFavorite('folder', folder.id)
                            }
                            onStyle={() =>
                              setDialog({ type: 'folder-style', folder })
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
                      <div
                        draggable
                        onPointerDown={() => prefetchDragUrl(file)}
                        onDragStart={(event) =>
                          handleFileDragStart(event, file)
                        }
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
                            canPreview={canInlinePreview(
                              file.mimeType,
                              file.name,
                            )}
                            onPreview={() => openPreview(file)}
                            onRename={() =>
                              setDialog({ type: 'rename-file', file })
                            }
                            onMove={() =>
                              setDialog({ type: 'move-file', file })
                            }
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
                            onVersions={() =>
                              setDialog({ type: 'versions', file })
                            }
                            onTags={() => setDialog({ type: 'tags', file })}
                            onNotes={() => setDialog({ type: 'notes', file })}
                            onFavorite={() =>
                              handleToggleFavorite('file', file.id)
                            }
                          />
                        </div>
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
                onClick={handleBulkDownload}
              >
                <Download />
                Stiahnuť
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDialog({ type: 'batch-rename' })}
              >
                <Type />
                Premenovať
              </Button>
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
                variant="outline"
                disabled={selectedIds.size !== 1}
                onClick={() => {
                  const fileId = [...selectedIds][0]
                  if (fileId) handleToggleFavorite('file', fileId)
                }}
              >
                <Star />
                Pin
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

        <FileVersionsDialog
          open={dialog?.type === 'versions'}
          fileId={dialog?.type === 'versions' ? dialog.file.id : null}
          fileName={dialog?.type === 'versions' ? dialog.file.name : ''}
          onOpenChange={(open) => !open && setDialog(null)}
          onRestored={() => refresh()}
        />

        <DuplicatesDialog
          open={dialog?.type === 'duplicates'}
          onOpenChange={(open) => !open && setDialog(null)}
          onChanged={() => refresh()}
        />

        <FileTagsDialog
          open={dialog?.type === 'tags'}
          fileId={dialog?.type === 'tags' ? dialog.file.id : null}
          fileName={dialog?.type === 'tags' ? dialog.file.name : ''}
          onOpenChange={(open) => !open && setDialog(null)}
        />

        <FileNotesDialog
          open={dialog?.type === 'notes'}
          fileId={dialog?.type === 'notes' ? dialog.file.id : null}
          fileName={dialog?.type === 'notes' ? dialog.file.name : ''}
          onOpenChange={(open) => !open && setDialog(null)}
        />

        <BatchRenameDialog
          open={dialog?.type === 'batch-rename'}
          fileNames={[...selectedIds]
            .map((id) => files.find((file) => file.id === id)?.name)
            .filter((name): name is string => Boolean(name))}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(pattern, startAt) =>
            run(
              () =>
                bulkRenameFiles({
                  data: {
                    fileIds: [...selectedIds],
                    pattern,
                    startAt,
                  },
                }),
              'Súbory premenované',
            ).then(clearSelection)
          }
        />

        <UploadConflictDialog
          open={uploadConflicts.length > 0}
          conflicts={uploadConflicts}
          onOpenChange={(open) => {
            if (!open) {
              setUploadConflicts([])
              setPendingUpload(null)
            }
          }}
          onCancel={() => {
            setUploadConflicts([])
            setPendingUpload(null)
          }}
          onKeepBoth={() => {
            if (!pendingUpload) return
            const taken = new Set([
              ...files.map((file) => file.name),
              ...pendingUpload.files.map((file) => file.name),
            ])
            const renamed = pendingUpload.files.map((file) => {
              if (!uploadConflicts.some((c) => c.name === file.name)) {
                return file
              }
              const nextName = uniqueKeepBothName(file.name, taken)
              taken.add(nextName)
              return new File([file], nextName, { type: file.type })
            })
            const dest = pendingUpload.dest
            setUploadConflicts([])
            setPendingUpload(null)
            void uploadFiles(renamed, dest)
          }}
          onReplace={() => {
            if (!pendingUpload || uploadConflicts.length !== 1) return
            const conflict = uploadConflicts[0]!
            const match = pendingUpload.files.find(
              (file) => file.name === conflict.name,
            )
            if (!match) return
            const dest = pendingUpload.dest
            setUploadConflicts([])
            setPendingUpload(null)
            void uploadFiles([match], {
              folderId: dest,
              replaceFileId: conflict.fileId,
            })
          }}
        />

        <FolderStyleDialog
          open={dialog?.type === 'folder-style'}
          folder={dialog?.type === 'folder-style' ? dialog.folder : null}
          onOpenChange={(open) => !open && setDialog(null)}
          onSave={(color, priority) => {
            if (dialog?.type !== 'folder-style') return
            return run(
              () =>
                updateFolderStyle({
                  data: {
                    folderId: dialog.folder.id,
                    color,
                    priority,
                  },
                }),
              'Štýl priečinka uložený',
            )
          }}
        />
      </AppShell>
    </DndProvider>
  )
}

function FolderActions({
  onRename,
  onMove,
  onDelete,
  onZip,
  onFavorite,
  onStyle,
}: {
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onZip: () => void
  onFavorite: () => void
  onStyle: () => void
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
        <DropdownMenuItem onClick={onZip}>
          <Archive /> Stiahnuť ZIP
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStyle}>
          <Star /> Farba / priorita
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFavorite}>
          <Star /> Obľúbené
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
  onVersions,
  onTags,
  onNotes,
  onFavorite,
}: {
  canPreview?: boolean
  onPreview?: () => void
  onRename: () => void
  onMove: () => void
  onDownload: () => void
  onDelete: () => void
  onShare: () => void
  onVersions: () => void
  onTags: () => void
  onNotes: () => void
  onFavorite: () => void
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
        <DropdownMenuItem onClick={onVersions}>
          <History /> Verzie
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTags}>
          <Tag /> Tagy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNotes}>
          <StickyNote /> Poznámky
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFavorite}>
          <Star /> Obľúbené
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
