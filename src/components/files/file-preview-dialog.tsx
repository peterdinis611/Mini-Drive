import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

import { FilePreviewBody } from '#/components/files/previews'
import { Button } from '#/components/ui/button'
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
import { getFileDownloadUrl } from '#/server/functions/files'
import type { DriveFile } from './types'

type Props = {
  file: DriveFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreviewDialog({ file, open, onOpenChange }: Props) {
  const { resolvedTheme } = useTheme()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  const showFooterDownload = Boolean(url) && canInlinePreview(kind)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[960px]">
        <DialogHeader className="border-b border-border px-5 py-4">
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
            <div className="flex h-[420px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Načítavam náhľad…
            </div>
          ) : (
            <FilePreviewBody
              kind={kind}
              url={url}
              fileName={file.name}
              mimeType={file.mimeType}
              fileSize={file.size}
              theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            />
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
  )
}
