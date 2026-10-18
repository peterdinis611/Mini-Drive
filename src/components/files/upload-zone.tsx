import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  CheckCircle2,
  CloudUpload,
  FileUp,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend, NativeTypes } from 'react-dnd-html5-backend'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Progress } from '#/components/ui/progress'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import {
  fileKindIcon,
  fileKindLabel,
  getFileKind,
} from '#/lib/file-kind'
import { riseTransition } from '#/lib/motion'
import { useUploadThing } from '#/lib/uploadthing'
import { validateFilesForUpload } from '#/lib/validation'
import { cn } from '#/lib/utils'

type Props = {
  folderId: string | null
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

function UploadDock({ folderId, onUploaded }: Props) {
  const reduce = useReducedMotion()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(0)
  const [queue, setQueue] = useState<QueuedFile[]>([])

  const { startUpload, isUploading } = useUploadThing('driveUploader', {
    uploadProgressGranularity: 'fine',
    onUploadProgress: (p) => setPercent(p),
    onClientUploadComplete: (res) => {
      setPercent(0)
      setQueue([])
      const count = res.length
      toast.success(count === 1 ? 'Súbor nahraný' : `Nahraných ${count} súborov`)
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
        await startUpload(files, { folderId })
      } catch (error) {
        setPercent(0)
        setQueue([])
        toast.error(getErrorMessage(error, 'Upload zlyhal'))
      }
    },
    [folderId, startUpload],
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
  const listening = canDrop && !isOver

  return (
    <motion.div
      ref={dropRef}
      className={cn(
        'upload-dock relative overflow-hidden rounded-xl border',
        active
          ? 'border-primary bg-accent/50 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent)]'
          : listening
            ? 'border-primary/50 bg-accent/25'
            : 'border-border bg-muted/30',
      )}
      animate={
        reduce
          ? undefined
          : {
              scale: active ? 1.01 : 1,
            }
      }
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <div className="upload-dock-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className={cn(
          'upload-dock-glow pointer-events-none absolute inset-0 transition-opacity duration-300',
          active ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              className={cn(
                'relative flex size-14 shrink-0 items-center justify-center rounded-2xl border',
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
              {!reduce && !isUploading ? (
                <motion.span
                  className="absolute inset-0 rounded-2xl border border-primary/30"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : null}
              {isUploading ? (
                <Loader2 className="size-6 animate-spin" aria-hidden />
              ) : active ? (
                <FileUp className="size-6" aria-hidden />
              ) : (
                <CloudUpload className="size-6" aria-hidden />
              )}
            </motion.div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl leading-tight">
                  {isUploading
                    ? 'Nahrávam do úložiska'
                    : active
                      ? 'Pusti súbory sem'
                      : 'Drop dock'}
                </h3>
                {!isUploading ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase ring-1 ring-border">
                    <Sparkles className="size-3 text-primary" />
                    react-dnd
                  </span>
                ) : null}
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                {isUploading
                  ? 'Súbory idú cez UploadThing (private ACL).'
                  : active
                    ? 'Uvoľni kurzor — okamžite ich spracujeme.'
                    : `Pretiahni súbory sem alebo vyber z disku. Max ${UPLOAD_LIMITS.maxFileCount} × ${UPLOAD_LIMITS.maxFileSize}.`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="min-w-[140px] self-start sm:self-center"
          >
            <CloudUpload />
            Vybrať súbory
          </Button>
        </div>

        {!isUploading ? (
          <div className="flex flex-wrap gap-1.5">
            {TYPE_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-background/70 px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/80"
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
              className="space-y-3 rounded-lg border border-border/80 bg-background/80 p-3 backdrop-blur-sm"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={riseTransition}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {queue.length}{' '}
                  {queue.length === 1 ? 'súbor v fronte' : 'súborov vo fronte'}
                </p>
                <p className="font-mono text-xs tabular-nums text-foreground">
                  {Math.round(percent)}%
                </p>
              </div>
              <Progress value={percent} className="h-1.5" />

              <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
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
          ) : null}
        </AnimatePresence>

        {!isUploading ? (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
              active
                ? 'border-primary bg-primary/5'
                : 'border-border/80 bg-background/40',
            )}
          >
            <p className="text-sm text-muted-foreground">
              {active ? (
                <span className="font-medium text-foreground">
                  Teraz pusti — nahrávanie začne hneď
                </span>
              ) : (
                <>
                  Alebo pretiahni súbory priamo na tento panel
                  <span className="mt-1 block text-xs">
                    HTML5 backend · NativeTypes.FILE
                  </span>
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
