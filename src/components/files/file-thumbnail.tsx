import { useEffect, useState } from 'react'

import { Image, DEFAULT_BLUR_DATA_URL } from '#/components/ui/image'
import { fileKindIcon, getFileKind } from '#/lib/file-kind'
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
  const kind = getFileKind(mimeType, name)
  const showPreview = Boolean(previewUrl) && kind === 'image' && !failed

  useEffect(() => {
    setFailed(false)
  }, [previewUrl])

  const box = size === 'sm' ? 'size-8 rounded' : 'size-11 rounded-md'
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4'
  const px = size === 'sm' ? 32 : 44

  if (showPreview && previewUrl) {
    return (
      <span
        className={cn(
          'relative inline-block shrink-0 overflow-hidden bg-muted ring-1 ring-border/80',
          box,
          className,
        )}
      >
        <Image
          src={previewUrl}
          alt=""
          fill
          sizes={`${px}px`}
          objectFit="cover"
          placeholder="blur"
          blurDataURL={DEFAULT_BLUR_DATA_URL}
          unoptimized
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  const Icon = fileKindIcon(kind)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-muted text-muted-foreground ring-1 ring-border/80',
        box,
        className,
      )}
    >
      <Icon className={iconClass} />
    </span>
  )
}
