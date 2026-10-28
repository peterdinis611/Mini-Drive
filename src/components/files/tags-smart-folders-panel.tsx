'use client'

import { useCallback, useEffect, useState } from 'react'
import { FolderSearch, Plus, Tag, Trash2 } from 'lucide-react'
import { toast } from '#/lib/toast'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { getErrorMessage } from '#/lib/errors'
import {
  createSmartFolder,
  createTag,
  deleteSmartFolder,
  deleteTag,
  listSmartFolders,
  listTags,
} from '#/server/functions/tags'

type TagRow = { id: string; name: string; color: string }
type SmartRow = {
  id: string
  name: string
  rules: { query?: string; kind?: string; duplicatesOnly?: boolean }
}

type Props = {
  onOpenSmart?: (rules: SmartRow['rules']) => void
}

export function TagsSmartFoldersPanel({ onOpenSmart }: Props) {
  const [tags, setTags] = useState<TagRow[]>([])
  const [smart, setSmart] = useState<SmartRow[]>([])
  const [tagName, setTagName] = useState('')
  const [smartName, setSmartName] = useState('')
  const [smartQuery, setSmartQuery] = useState('')

  const refresh = useCallback(() => {
    void Promise.all([listTags(), listSmartFolders()])
      .then(([tagRows, smartRows]) => {
        setTags(tagRows)
        setSmart(smartRows)
      })
      .catch((error) => toast.error(getErrorMessage(error)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 dark:border-primary/30">
        <header className="flex items-center gap-2">
          <Tag className="size-4" aria-hidden />
          <h2 className="font-display text-lg">Tagy</h2>
        </header>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!tagName.trim()) return
            void createTag({ data: { name: tagName.trim() } })
              .then(() => {
                setTagName('')
                refresh()
                toast.success('Tag vytvorený')
              })
              .catch((error) => toast.error(getErrorMessage(error)))
          }}
        >
          <Input
            value={tagName}
            onChange={(event) => setTagName(event.target.value)}
            placeholder="Nový tag…"
            aria-label="Názov tagu"
          />
          <Button type="submit" size="icon" aria-label="Pridať tag">
            <Plus className="size-4" />
          </Button>
        </form>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-sm"
              style={{ borderColor: tag.color }}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: tag.color }}
                aria-hidden
              />
              {tag.name}
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={`Zmazať tag ${tag.name}`}
                onClick={() => {
                  void deleteTag({ data: { tagId: tag.id } })
                    .then(refresh)
                    .catch((error) => toast.error(getErrorMessage(error)))
                }}
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 dark:border-primary/30">
        <header className="flex items-center gap-2">
          <FolderSearch className="size-4" aria-hidden />
          <h2 className="font-display text-lg">Smart folders</h2>
        </header>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            if (!smartName.trim()) return
            void createSmartFolder({
              data: {
                name: smartName.trim(),
                rules: {
                  query: smartQuery.trim() || undefined,
                },
              },
            })
              .then(() => {
                setSmartName('')
                setSmartQuery('')
                refresh()
                toast.success('Smart folder uložený')
              })
              .catch((error) => toast.error(getErrorMessage(error)))
          }}
        >
          <Input
            value={smartName}
            onChange={(event) => setSmartName(event.target.value)}
            placeholder="Názov…"
            aria-label="Názov smart foldera"
          />
          <Input
            value={smartQuery}
            onChange={(event) => setSmartQuery(event.target.value)}
            placeholder="Query / obsah…"
            aria-label="Pravidlo query"
          />
          <Button type="submit" size="icon" aria-label="Pridať smart folder">
            <Plus className="size-4" />
          </Button>
        </form>
        <ul className="m-0 list-none space-y-2 p-0">
          {smart.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left text-sm hover:underline"
                onClick={() => onOpenSmart?.(item.rules)}
              >
                <span className="font-medium">{item.name}</span>
                {item.rules.query ? (
                  <span className="ml-2 text-muted-foreground">
                    „{item.rules.query}“
                  </span>
                ) : null}
              </button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label={`Zmazať ${item.name}`}
                onClick={() => {
                  void deleteSmartFolder({ data: { smartFolderId: item.id } })
                    .then(refresh)
                    .catch((error) => toast.error(getErrorMessage(error)))
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
