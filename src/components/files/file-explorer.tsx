import { useMemo, useState, useTransition } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  Download,
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
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'

import { UploadZone } from '#/components/files/upload-zone'
import { NameDialog } from '#/components/files/name-dialog'
import { MoveDialog } from '#/components/files/move-dialog'
import { DeleteFolderDialog } from '#/components/files/delete-folder-dialog'
import { ShareDialog } from '#/components/files/share-dialog'
import { FileThumbnail } from '#/components/files/file-thumbnail'
import { useImagePreviews } from '#/components/files/use-image-previews'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
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
  | null

export function FileExplorer({
  folderId,
  userName,
  userEmail,
  stats,
  initial,
}: Props) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [view, setView] = useState<'grid' | 'list'>(initial.viewPreference)
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(true)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pending, startTransition] = useTransition()
  const previewUrls = useImagePreviews(initial.files, view === 'grid')

  const folders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initial.folders
    return initial.folders.filter((f) => f.name.toLowerCase().includes(q))
  }, [initial.folders, query])

  const files = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initial.files
    return initial.files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.mimeType.toLowerCase().includes(q),
    )
  }, [initial.files, query])

  const empty = folders.length === 0 && files.length === 0

  const excludeForFolderMove = useMemo(() => {
    if (dialog?.type !== 'move-folder') return []
    return [dialog.folder.id]
  }, [dialog])

  function refresh() {
    void router.invalidate()
  }

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
        setDialog(null)
        refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Operácia zlyhala')
      }
    })
  }

  const currentName =
    initial.breadcrumbs[initial.breadcrumbs.length - 1]?.name ?? 'Súbory'

  return (
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
          <div className="relative hidden min-w-[200px] sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hľadať…"
              className="h-9 pl-8"
              aria-label="Hľadať"
            />
          </div>
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
            variant="outline"
            onClick={() => setShowUpload((v) => !v)}
          >
            <Upload />
            Nahrať
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
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hľadať…"
              className="h-9 pl-8"
            />
          </div>
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
              <UploadZone folderId={folderId} onUploaded={refresh} />
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
            <motion.div
              className="flex flex-col items-center gap-3 px-6 py-16 text-center"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={riseTransition}
            >
              <Folder className="size-9 text-muted-foreground" aria-hidden />
              <h3 className="text-lg font-medium">
                {query ? 'Žiadne výsledky' : 'Zatiaľ prázdne'}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query
                  ? 'Skús iný výraz alebo vymaž filter.'
                  : 'Nahraj súbor alebo vytvor nový priečinok.'}
              </p>
            </motion.div>
          ) : view === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Názov</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Veľkosť</TableHead>
                  <TableHead>Dátum</TableHead>
                  <TableHead className="w-12 text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map((folder) => (
                  <TableRow key={folder.id}>
                    <TableCell>
                      <Link
                        to="/files/$folderId"
                        params={{ folderId: folder.id }}
                        className="inline-flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <Folder className="size-4 text-primary" />
                        {folder.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      priečinok
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{formatDate(folder.createdAt)}</TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <FileThumbnail
                          name={file.name}
                          mimeType={file.mimeType}
                          size="sm"
                        />
                        {file.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.mimeType || '—'}
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <FileActions
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Stagger
              key="grid"
              className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3"
            >
              {folders.map((folder) => (
                <StaggerItem key={folder.id}>
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
                          priečinok
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
                </StaggerItem>
              ))}
              {files.map((file) => (
                <StaggerItem key={file.id}>
                  <motion.div
                    className="group relative rounded-md px-3 py-3 hover:bg-muted/70"
                    whileHover={reduce ? undefined : { y: -1 }}
                    transition={riseTransition}
                  >
                    <div className="flex items-start gap-3">
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
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <FileActions
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
    </AppShell>
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
  onRename,
  onMove,
  onDownload,
  onDelete,
  onShare,
}: {
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
