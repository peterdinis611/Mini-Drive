import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  CloudUpload,
  FileUp,
  Folder,
  Loader2,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend, NativeTypes } from 'react-dnd-html5-backend'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Progress } from '#/components/ui/progress'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import {
  fileKindIcon,
  fileKindLabel,
  getFileKind,
} from '#/lib/file-kind'
import { formatFileSize } from '#/lib/format'
import { formatFolderPath } from '#/lib/folder-ops'
import { riseTransition } from '#/lib/motion'
import { toast } from '#/lib/toast'
import { useUploadThing } from '#/lib/uploadthing'
import { cn } from '#/lib/utils'
import { validateFilesForUpload } from '#/lib/validation'
import type { FolderTreeNode } from './types'

type Props = {
  folderId: string | null
  folders: FolderTreeNode[]
  onUploaded: () => void
}

type QueuedFile = {
  id: string
  file: File
  kind: ReturnType<typeof getFileKind>
}

type NativeFileDrop = {
  files: File[]
}

const TYPE_CHIPS = ['Obrázky', 'PDF', 'Video', 'Audio', 'Text'] as const

export function UploadZone(props: Props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <UploadDock {...props} />
    </DndProvider>
  )
}

function UploadDock({ folderId, folders, onUploaded }: Props) {
  const reduce = useReducedMotion()
  const inputId = useId()
  const targetId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(0)
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [targetFolderId, setTargetFolderId] = useState<string | null>(folderId)

  useEffect(() => {
    setTargetFolderId(folderId)
  }, [folderId])

  const destinationOptions = useMemo(() => {
    const opts: Array<{ id: string | null; label: string }> = [
      { id: null, label: 'Súbory (koreň)' },
    ]
    for (const folder of folders) {
      opts.push({
        id: folder.id,
        label: formatFolderPath(folder, folders),
      })
    }
    return opts
  }, [folders])

  const destinationLabel =
    destinationOptions.find((o) => o.id === targetFolderId)?.label ??
    'Súbory (koreň)'

  const { startUpload, isUploading } = useUploadThing('driveUploader', {
    uploadProgressGranularity: 'fine',
    onUploadProgress: (p) => setPercent(p),
    onClientUploadComplete: (res) => {
      setPercent(0)
      setQueue([])
      const count = res.length
      toast.success(
        count === 1 ? 'Súbor nahraný' : `Nahraných ${count} súborov`,
        { description: `Cieľ: ${destinationLabel}` },
      )
      onUploaded()
    },
    onUploadError: (error) => {
      setPercent(0)
      setQueue([])
      toast.error(getErrorMessage(error, 'Upload zlyhal'))
    },
  })

  const handleFiles = useCallback(
    async (incoming: File[] | FileList | null | undefined) => {
      const validated = validateFilesForUpload(incoming)
      if (!validated.ok) {
        toast.error(validated.message)
        return
      }

      const { files } = validated
      if (
        incoming &&
        Array.from(incoming).length > UPLOAD_LIMITS.maxFileCount
      ) {
        toast.message(
          `Nahrám prvých ${UPLOAD_LIMITS.maxFileCount} súborov (limit).`,
        )
      }

      setQueue(
        files.map((file, index) => ({
          id: `${file.name}-${file.size}-${index}`,
          file,
          kind: getFileKind(file.type, file.name),
        })),
      )

      try {
        await startUpload(files, { folderId: targetFolderId })
      } catch (error) {
        setPercent(0)
        setQueue([])
        toast.error(getErrorMessage(error, 'Upload zlyhal'))
      }
    },
    [startUpload, targetFolderId],
  )

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop: (item: NativeFileDrop) => {
        void handleFiles(item.files)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [handleFiles],
  )

  useEffect(() => {
    drop(dropRef)
  }, [drop])

  const active = canDrop && isOver

  return (
    <motion.div
      ref={dropRef}
      className={cn(
        'upload-dock relative overflow-hidden rounded-2xl border',
        active
          ? 'border-primary bg-accent/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_30%,transparent)]'
          : 'border-border/80 bg-card/40',
      )}
      animate={reduce ? undefined : { scale: active ? 1.008 : 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <div
        className="upload-dock-grid pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div
        className={cn(
          'upload-dock-glow pointer-events-none absolute inset-0 transition-opacity duration-300',
          active ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              className={cn(
                'relative flex size-12 shrink-0 items-center justify-center rounded-xl border',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-primary',
              )}
              animate={
                reduce
                  ? undefined
                  : active
                    ? { y: -2, rotate: -4 }
                    : { y: 0, rotate: 0 }
              }
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            >
              {isUploading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : active ? (
                <FileUp className="size-5" aria-hidden />
              ) : (
                <CloudUpload className="size-5" aria-hidden />
              )}
            </motion.div>

            <div className="min-w-0 space-y-1">
              <h3 className="font-display text-xl leading-tight">
                {isUploading
                  ? 'Nahrávam…'
                  : active
                    ? 'Pusti sem'
                    : 'Nahrať súbory'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isUploading
                  ? `Do „${destinationLabel}“`
                  : active
                    ? `Uvoľni — uloží sa do „${destinationLabel}“`
                    : `Pretiahni alebo vyber. Max ${UPLOAD_LIMITS.maxFileCount} × ${UPLOAD_LIMITS.maxFileSize}.`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="self-start sm:self-center"
          >
            <CloudUpload />
            Vybrať súbory
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/70 p-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor={targetId} className="text-xs text-muted-foreground">
              Cieľový priečinok
            </Label>
            <div className="relative">
              <Folder
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary"
                aria-hidden
              />
              <select
                id={targetId}
                disabled={isUploading}
                value={targetFolderId ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  setTargetFolderId(value === '' ? null : value)
                }}
                className={cn(
                  'h-10 w-full appearance-none rounded-lg border border-border bg-background py-2 pr-8 pl-9 text-sm outline-none',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {destinationOptions.map((option) => (
                  <option key={option.id ?? 'root'} value={option.id ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="pb-2 text-xs text-muted-foreground sm:max-w-[220px]">
            Otvor priečinok v strome, alebo ho vyber tu pred uploadom.
          </p>
        </div>

        {!isUploading ? (
          <div className="flex flex-wrap gap-1.5">
            {TYPE_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-background/70 px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/70"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          multiple
          disabled={isUploading}
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
        />

        <AnimatePresence initial={false} mode="popLayout">
          {isUploading && queue.length > 0 ? (
            <motion.div
              key="queue"
              className="space-y-3 rounded-xl border border-border/80 bg-background/85 p-3 backdrop-blur-sm"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={riseTransition}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {queue.length}{' '}
                  {queue.length === 1 ? 'súbor' : 'súborov'} → {destinationLabel}
                </p>
                <p className="font-mono text-xs tabular-nums text-foreground">
                  {Math.round(percent)}%
                </p>
              </div>
              <Progress value={percent} className="h-1.5" />

              <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
                {queue.map((item, index) => {
                  const Icon = fileKindIcon(item.kind)
                  return (
                    <motion.li
                      key={item.id}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...riseTransition, delay: index * 0.04 }}
                    >
                      <span className="flex size-8 items-center justify-center rounded-md bg-muted text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fileKindLabel(item.kind)} ·{' '}
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                      {percent >= 100 ? (
                        <CheckCircle2
                          className="size-4 text-primary"
                          aria-hidden
                        />
                      ) : (
                        <Loader2
                          className="size-4 animate-spin text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </motion.li>
                  )
                })}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              className={cn(
                'flex min-h-[88px] items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border/70 bg-background/35',
              )}
              initial={false}
            >
              <p className="text-sm text-muted-foreground">
                {active ? (
                  <span className="font-medium text-foreground">
                    Teraz pusti — uloží sa do „{destinationLabel}“
                  </span>
                ) : (
                  'Pretiahni súbory sem z Finderu alebo prieskumníka'
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
