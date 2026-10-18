import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

import { cn } from '#/lib/utils'

type NativeFileDrop = {
  files: File[]
}

type Props = {
  folderId: string
  folderName: string
  disabled?: boolean
  onDropFiles: (files: File[], folderId: string) => void
  className?: string
  children: ReactNode
}

/** Accepts OS file drops to upload into a specific folder. */
export function FolderDropTarget({
  folderId,
  folderName,
  disabled = false,
  onDropFiles,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      canDrop: () => !disabled,
      drop: (item: NativeFileDrop) => {
        onDropFiles(item.files, folderId)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [disabled, folderId, onDropFiles],
  )

  useEffect(() => {
    drop(ref)
  }, [drop])

  const active = canDrop && isOver

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-md transition-colors',
        active && 'bg-primary/10 ring-2 ring-primary/50 ring-inset',
        className,
      )}
      data-drop-folder={folderId}
      aria-label={
        active ? `Pusti sem pre upload do „${folderName}“` : undefined
      }
    >
      {children}
      {active ? (
        <p className="px-3 pb-2 text-xs font-medium text-primary">
          Nahrať do „{folderName}“
        </p>
      ) : null}
    </div>
  )
}
