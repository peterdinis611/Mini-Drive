'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { useNavigate } from '@tanstack/react-router'
import { FileIcon, Folder, Search } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '#/components/ui/command'
import { Button } from '#/components/ui/button'
import { PreloadSpinner } from '#/components/ui/preload-spinner'
import { formatFileSize } from '#/lib/format'
import {
  buildDriveSearchItems,
  createDriveFuse,
  searchDriveItems,
} from '#/lib/drive-search'
import type { DriveSearchItem } from '#/lib/drive-search'
import { dispatchQuickAction, onQuickAction } from '#/lib/quick-actions'
import { cn } from '#/lib/utils'
import { getDriveSearchIndex } from '#/server/functions/drive'

type TriggerProps = {
  className?: string
  /** Compact trigger for mobile toolbar */
  compact?: boolean
}

/** Toolbar button — opens the global search host via quick-action bus. */
export function DriveSearchTrigger({
  className,
  compact = false,
}: TriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        compact
          ? 'h-9 w-full justify-start gap-2 px-3 font-normal text-muted-foreground'
          : 'hidden h-9 min-w-[220px] justify-between gap-3 px-3 font-normal text-muted-foreground sm:inline-flex',
        className,
      )}
      onClick={() => dispatchQuickAction('search')}
      aria-label="Hľadať súbory a priečinky"
    >
      <span className="inline-flex items-center gap-2 truncate">
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Hľadať…</span>
      </span>
      {!compact ? (
        <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      ) : null}
    </Button>
  )
}

/** Single global command palette — mount once in AppShell. */
export function DriveSearchHost() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<DriveSearchItem[]>([])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    return onQuickAction((action) => {
      if (action === 'search') setOpen(true)
    })
  }, [])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    void getDriveSearchIndex()
      .then((index) => {
        if (cancelled) return
        setItems(buildDriveSearchItems(index.folders, index.files))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const [debouncedQuery] = useDebouncedValue(query, { wait: 200 })

  const fuse = useMemo(() => createDriveFuse(items), [items])

  const results = useMemo(
    () => searchDriveItems(fuse, items, debouncedQuery),
    [fuse, items, debouncedQuery],
  )

  const folders = results.filter((item) => item.kind === 'folder')
  const files = results.filter((item) => item.kind === 'file')

  function selectItem(item: DriveSearchItem) {
    setOpen(false)
    if (item.kind === 'folder') {
      void navigate({
        to: '/files/$folderId',
        params: { folderId: item.id },
      })
      return
    }
    if (item.folderId) {
      void navigate({
        to: '/files/$folderId',
        params: { folderId: item.folderId },
      })
      return
    }
    void navigate({ to: '/files' })
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Hľadať súbory a priečinky…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading ? (
          <PreloadSpinner
            className="py-10"
            size="sm"
            label="Načítavam index…"
          />
        ) : (
          <>
            <CommandEmpty>
              Nič sa nenašlo pre „{query.trim() || '…'}“.
            </CommandEmpty>

            {folders.length > 0 ? (
              <CommandGroup heading="Priečinky">
                {folders.map((item) => (
                  <CommandItem
                    key={`folder-${item.id}`}
                    value={`folder ${item.name} ${item.pathLabel}`}
                    onSelect={() => selectItem(item)}
                  >
                    <Folder className="text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.pathLabel}
                      </p>
                    </div>
                    <CommandShortcut>otvoriť</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {folders.length > 0 && files.length > 0 ? (
              <CommandSeparator />
            ) : null}

            {files.length > 0 ? (
              <CommandGroup heading="Súbory">
                {files.map((item) => (
                  <CommandItem
                    key={`file-${item.id}`}
                    value={`file ${item.name} ${item.pathLabel} ${item.mimeType}`}
                    onSelect={() => selectItem(item)}
                  >
                    <FileIcon className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.pathLabel} · {formatFileSize(item.size)}
                      </p>
                    </div>
                    <CommandShortcut>prejsť</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span>Fuzzy search · Fuse.js</span>
        <span className="hidden sm:inline">
          ↑↓ navigácia · ↵ výber · esc zatvoriť
        </span>
      </div>
    </CommandDialog>
  )
}

/** @deprecated Prefer DriveSearchTrigger + DriveSearchHost */
export function DriveSearchDialog(props: TriggerProps) {
  return <DriveSearchTrigger {...props} />
}
