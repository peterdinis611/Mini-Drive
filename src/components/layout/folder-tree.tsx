'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  HardDrive,
  Search,
} from 'lucide-react'

import type { FolderTreeNode } from '#/components/files/types'
import {
  buildFolderTree,
  collectExpandableFolderIds,
  flattenFolderRows,
  getAncestorFolderIds,
  type FlatFolderRow,
} from '#/lib/folder-tree'
import { cn } from '#/lib/utils'

type Props = {
  folders: FolderTreeNode[]
  activeFolderId: string | null
  onNavigate?: () => void
}

const ROW_HEIGHT = 32

export function FolderTree({ folders, activeFolderId, onNavigate }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [filterInput, setFilterInput] = useState('')
  const [debouncedFilter] = useDebouncedValue(filterInput, { wait: 180 })

  const tree = useMemo(() => buildFolderTree(folders), [folders])

  useEffect(() => {
    if (!activeFolderId) return
    const ancestors = getAncestorFolderIds(activeFolderId, folders)
    if (ancestors.length === 0) return
    setOpen((prev) => {
      let changed = false
      const next = { ...prev }
      for (const id of ancestors) {
        if (!next[id]) {
          next[id] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [activeFolderId, folders])

  const rows = useMemo(
    () =>
      flattenFolderRows(tree, {
        open,
        activeFolderId,
        filter: debouncedFilter,
      }),
    [tree, open, activeFolderId, debouncedFilter],
  )

  /** Index 0 = root “Všetky súbory”, then flattened folders. */
  const itemCount = rows.length + 1

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    getItemKey: (index) => (index === 0 ? '__root__' : rows[index - 1]!.id),
  })

  const expandableIds = useMemo(
    () => collectExpandableFolderIds(tree),
    [tree],
  )

  function expandAll() {
    const next: Record<string, boolean> = {}
    for (const id of expandableIds) next[id] = true
    setOpen(next)
  }

  function collapseAll() {
    const next: Record<string, boolean> = {}
    for (const id of expandableIds) next[id] = false
    setOpen(next)
  }

  function toggleOpen(id: string, currentlyOpen: boolean) {
    setOpen((prev) => ({ ...prev, [id]: !currentlyOpen }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="flex items-center gap-1 px-1">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filterInput}
            onChange={(event) => setFilterInput(event.target.value)}
            placeholder="Filtrovať priečinky…"
            aria-label="Filtrovať priečinky"
            className="h-7 w-full rounded-full border border-sidebar-border bg-sidebar-accent/40 pr-2 pl-7 text-[11px] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Rozbaliť všetko"
          title="Rozbaliť všetko"
          onClick={expandAll}
          disabled={expandableIds.length === 0}
        >
          <ChevronsUpDown className="size-3.5" />
        </button>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Zbaliť všetko"
          title="Zbaliť všetko"
          onClick={collapseAll}
          disabled={expandableIds.length === 0}
        >
          <ChevronsDownUp className="size-3.5" />
        </button>
      </div>

      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5"
        role="tree"
        aria-label="Strom priečinkov"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            if (virtualRow.index === 0) {
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                  role="treeitem"
                  aria-selected={activeFolderId === null}
                >
                  <Link
                    to="/files"
                    onClick={onNavigate}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-full px-3 text-sm transition',
                      activeFolderId === null
                        ? 'bg-primary/25 font-medium text-foreground dark:bg-primary/20 dark:text-primary'
                        : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
                    )}
                  >
                    <HardDrive className="size-4 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate">Všetky súbory</span>
                    <span className="shrink-0 font-meta text-[10px] text-muted-foreground/80 tabular-nums">
                      {folders.length}
                    </span>
                  </Link>
                </div>
              )
            }

            const row = rows[virtualRow.index - 1]!
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
                role="treeitem"
                aria-selected={row.isActive}
                aria-expanded={row.hasChildren ? open[row.id] ?? row.depth < 1 : undefined}
                aria-level={row.depth + 1}
              >
                <FolderTreeRow
                  row={row}
                  isOpen={open[row.id] ?? row.depth < 1}
                  onToggle={() =>
                    toggleOpen(row.id, open[row.id] ?? row.depth < 1)
                  }
                  onNavigate={onNavigate}
                />
              </div>
            )
          })}
        </div>

        {debouncedFilter.trim() && rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
            Žiadny priečinok pre „{debouncedFilter.trim()}“
          </p>
        ) : null}
      </div>
    </div>
  )
}

function FolderTreeRow({
  row,
  isOpen,
  onToggle,
  onNavigate,
}: {
  row: FlatFolderRow
  isOpen: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const FolderIcon = isOpen && row.hasChildren ? FolderOpen : Folder
  const metaParts: string[] = []
  if (row.childCount > 0) metaParts.push(`${row.childCount} pr.`)
  if (row.fileCount > 0) metaParts.push(`${row.fileCount} súb.`)

  return (
    <div
      className={cn(
        'group flex h-8 items-center gap-0.5 rounded-full',
        row.isActive
          ? 'bg-primary/25 font-medium text-foreground dark:bg-primary/20 dark:text-primary'
          : row.isAncestorOfActive
            ? 'bg-sidebar-accent/40 text-foreground'
            : 'hover:bg-sidebar-accent/70',
      )}
      style={{ paddingLeft: 6 + row.depth * 12 }}
      title={row.pathLabel}
    >
      <button
        type="button"
        className="flex size-6 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"
        aria-label={isOpen ? 'Zbaliť' : 'Rozbaliť'}
        onClick={onToggle}
        disabled={!row.hasChildren}
      >
        {row.hasChildren ? (
          isOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )
        ) : (
          <span className="size-3.5" aria-hidden />
        )}
      </button>
      <Link
        to="/files/$folderId"
        params={{ folderId: row.id }}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-sm"
      >
        <FolderIcon
          className={cn(
            'size-4 shrink-0',
            row.isActive ? 'opacity-100' : 'opacity-75',
          )}
        />
        <span className="min-w-0 flex-1 truncate">{row.name}</span>
        {metaParts.length > 0 ? (
          <span className="hidden shrink-0 font-meta text-[10px] text-muted-foreground/75 tabular-nums group-hover:inline xl:inline">
            {metaParts.join(' · ')}
          </span>
        ) : null}
      </Link>
    </div>
  )
}
