import { Suspense, useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { useTheme } from 'next-themes'

import { FilePreviewBody } from '#/components/files/previews'
import { ShareDialog } from '#/components/files/share-dialog'
import { Button } from '#/components/ui/button'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { getErrorMessage } from '#/lib/errors'
import { canInlinePreview, fileKindLabel, getFileKind } from '#/lib/file-kind'
import { formatFileSize } from '#/lib/format'
import { toast } from '#/lib/toast'
import { cn } from '#/lib/utils'
import { getFileDownloadUrl } from '#/server/functions/files'
import type { DriveFile } from './types'

type Props = {
  file: DriveFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSavedToDrive?: () => void
  defaultShareExpiresIn?: number
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
  onSavedToDrive,
  defaultShareExpiresIn,
}: Props) {
  const { resolvedTheme } = useTheme()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const kind = file ? getFileKind(file.mimeType, file.name) : 'file'
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!open || !file) {
      setUrl(null)
      return
    }

    cancelledRef.current = false
    setLoading(true)
    setUrl(null)

    void (async () => {
      try {
        const result = await getFileDownloadUrl({ data: { fileId: file.id } })
        if (cancelledRef.current) return
        setUrl(result.url)
      } catch (error) {
        if (cancelledRef.current) return
        toast.error(getErrorMessage(error, 'Náhľad sa nepodarilo načítať'))
        onOpenChange(false)
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    })()

    return () => {
      cancelledRef.current = true
    }
  }, [file, onOpenChange, open])

  // Image block has its own Notion-like toolbar with download/crop.
  const showFooterDownload =
    Boolean(url) && canInlinePreview(kind) && kind !== 'image'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex max-h-[92vh] w-[min(960px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden border-border/60 bg-background/95 p-0 shadow-2xl sm:max-w-[960px]',
            kind === 'image' && 'sm:max-w-[1040px]',
          )}
          overlayClassName="bg-black/45 backdrop-blur-xl supports-[backdrop-filter]:bg-black/35"
        >
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle className="truncate pr-8">
              {file?.name ?? 'Náhľad'}
            </DialogTitle>
            <DialogDescription>
              {file
                ? `${formatFileSize(file.size)} · ${fileKindLabel(kind)} · ${file.mimeType || 'súbor'}`
                : '—'}
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[420px] flex-1 bg-muted/30">
            {loading || !url || !file ? (
              <PreviewLoading />
            ) : (
              <Suspense fallback={<PreviewLoading />}>
                <FilePreviewBody
                  kind={kind}
                  url={url}
                  fileName={file.name}
                  mimeType={file.mimeType}
                  fileSize={file.size}
                  fileId={file.id}
                  folderId={file.folderId}
                  onRequestShare={
                    kind === 'image' ? () => setShareOpen(true) : undefined
                  }
                  onSavedToDrive={onSavedToDrive}
                  theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                />
              </Suspense>
            )}
          </div>

          {showFooterDownload && url ? (
            <div className="flex justify-end border-t border-border px-4 py-3">
              <Button asChild variant="outline" size="sm">
                <a href={url} target="_blank" rel="noreferrer">
                  <Download />
                  Stiahnuť
                </a>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ShareDialog
        open={shareOpen}
        fileId={file?.id ?? null}
        fileName={file?.name ?? ''}
        defaultExpiresIn={defaultShareExpiresIn}
        onOpenChange={setShareOpen}
      />
    </>
  )
}
