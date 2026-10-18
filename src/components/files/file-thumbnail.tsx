import { useEffect, useState } from 'react'
import { FileIcon, ImageIcon } from 'lucide-react'

import { isImageMimeType } from '#/lib/preload'
import { cn } from '#/lib/utils'

type Props = {
  name: string
  mimeType: string
  previewUrl?: string | null
  className?: string
  size?: 'sm' | 'md'
}

export function FileThumbnail({
  name,
  mimeType,
  previewUrl,
  className,
  size = 'md',
}: Props) {
  const [failed, setFailed] = useState(false)
  const isImage = isImageMimeType(mimeType)
  const showPreview = Boolean(previewUrl) && isImage && !failed

  useEffect(() => {
    setFailed(false)
  }, [previewUrl])

  const box =
    size === 'sm'
      ? 'size-8 rounded'
      : 'size-11 rounded-md'

  if (showPreview && previewUrl) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden bg-muted ring-1 ring-border/80',
          box,
          className,
        )}
      >
        <img
          src={previewUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-muted/80 text-muted-foreground',
        box,
        className,
      )}
      aria-hidden
      title={name}
    >
      {isImage ? (
        <ImageIcon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      ) : (
        <FileIcon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      )}
    </span>
  )
}
