import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'

import { Progress } from '#/components/ui/progress'
import { UPLOAD_LIMITS } from '#/lib/constants'
import { useUploadThing } from '#/lib/uploadthing'
import { cn } from '#/lib/utils'

type Props = {
  folderId: string | null
  onUploaded: () => void
}

export function UploadZone({ folderId, onUploaded }: Props) {
  const reduce = useReducedMotion()
  const [percent, setPercent] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [fileLabels, setFileLabels] = useState<string[]>([])

  const { startUpload, isUploading } = useUploadThing('driveUploader', {
    uploadProgressGranularity: 'fine',
    onUploadProgress: (p) => setPercent(p),
    onClientUploadComplete: (res) => {
      setPercent(0)
      setFileLabels([])
      const count = res.length
      toast.success(count === 1 ? 'Súbor nahraný' : `Nahraných ${count} súborov`)
      onUploaded()
    },
    onUploadError: (error) => {
      setPercent(0)
      setFileLabels([])
      toast.error(error.message || 'Upload zlyhal')
    },
  })

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    const files = Array.from(fileList).slice(0, UPLOAD_LIMITS.maxFileCount)
    setFileLabels(files.map((f) => f.name))
    await startUpload(files, { folderId })
  }

  return (
    <motion.div
      className={cn(
        'overflow-hidden rounded-lg border border-dashed',
        dragOver
          ? 'border-primary bg-accent/60'
          : 'border-border bg-muted/40',
      )}
      animate={
        reduce
          ? undefined
          : {
              scale: dragOver ? 1.012 : 1,
              borderColor: dragOver
                ? 'var(--primary)'
                : 'var(--border)',
            }
      }
      whileHover={
        reduce || isUploading || dragOver
          ? undefined
          : { backgroundColor: 'color-mix(in oklab, var(--muted) 70%, transparent)' }
      }
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        void handleFiles(event.dataTransfer.files)
      }}
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <motion.span
          className="inline-flex"
          animate={
            reduce
              ? undefined
              : dragOver
                ? { y: -4, scale: 1.1 }
                : { y: 0, scale: 1 }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {isUploading ? (
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          ) : (
            <Upload className="size-6 text-muted-foreground" aria-hidden />
          )}
        </motion.span>
        <div>
          <p className="text-sm font-medium">
            {isUploading ? 'Nahrávam cez UploadThing…' : 'Pretiahni súbory sem'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            alebo klikni · max {UPLOAD_LIMITS.maxFileCount} súborov ·{' '}
            {UPLOAD_LIMITS.maxFileSize}
          </p>
        </div>
        <input
          type="file"
          className="sr-only"
          multiple
          disabled={isUploading}
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </label>

      <AnimatePresence initial={false}>
        {isUploading ? (
          <motion.div
            key="progress"
            className="space-y-2 border-t border-border px-4 py-3"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {fileLabels.length > 0 ? (
              <p className="truncate text-xs text-muted-foreground">
                {fileLabels.join(', ')}
              </p>
            ) : null}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(percent)}%</span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
