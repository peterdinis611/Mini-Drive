'use client'

import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import { toast } from '#/lib/toast'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { getErrorMessage } from '#/lib/errors'
import { listTags, setFileTags } from '#/server/functions/tags'

type Props = {
  open: boolean
  fileId: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
}

export function FileTagsDialog({
  open,
  fileId,
  fileName,
  onOpenChange,
}: Props) {
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>(
    [],
  )
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    void listTags()
      .then(setTags)
      .catch((error) => toast.error(getErrorMessage(error)))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-4" aria-hidden />
            Tagy — {fileName}
          </DialogTitle>
          <DialogDescription>
            Vytvor tagy v Nastaveniach, potom ich priraď tu.
          </DialogDescription>
        </DialogHeader>
        {tags.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Zatiaľ žiadne tagy.
          </p>
        ) : (
          <ul className="m-0 max-h-60 list-none space-y-2 overflow-y-auto p-0">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.has(tag.id)}
                  onCheckedChange={(checked) => {
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (checked) next.add(tag.id)
                      else next.delete(tag.id)
                      return next
                    })
                  }}
                  id={`tag-${tag.id}`}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: tag.color }}
                    aria-hidden
                  />
                  {tag.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button
            type="button"
            disabled={!fileId || saving || tags.length === 0}
            onClick={() => {
              if (!fileId) return
              setSaving(true)
              void setFileTags({
                data: { fileId, tagIds: [...selected] },
              })
                .then(() => {
                  toast.success('Tagy uložené')
                  onOpenChange(false)
                })
                .catch((error) => toast.error(getErrorMessage(error)))
                .finally(() => setSaving(false))
            }}
          >
            Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
