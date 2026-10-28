'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  Folders,
  HardDrive,
  Search,
  X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

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

const ROW_HEIGHT = 34

export function FolderTree({ folders, activeFolderId, onNavigate }: Props) {
  const parentRef = useRef<HTMLElement>(null)
  const filterId = useId()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [filterInput, setFilterInput] = useState('')
  const [debouncedFilter] = useDebouncedValue(filterInput, { wait: 180 })

  const tree = useMemo(() => buildFolderTree(folders), [folders])
  const hasFilter = Boolean(debouncedFilter.trim())

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
    <div className="flex h-full min-h-0 flex-col gap-2">
      <search className="overflow-hidden rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/25 shadow-[inset_0_1px_0_color-mix(in_oklab,white_6%,transparent)]">
        <form
          className="flex items-center gap-0.5 p-1"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor={filterId} className="sr-only">
            Filtrovať priečinky
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/80"
              aria-hidden
            />
            <input
              id={filterId}
              type="search"
              name="folder-filter"
              value={filterInput}
              onChange={(event) => setFilterInput(event.target.value)}
              placeholder="Filtrovať…"
              autoComplete="off"
              className="h-8 w-full rounded-xl border-0 bg-transparent pr-8 pl-8 text-[12px] text-sidebar-foreground outline-none placeholder:text-muted-foreground/65 focus-visible:bg-sidebar-accent/50 focus-visible:ring-1 focus-visible:ring-sidebar-ring/50"
            />
            {filterInput ? (
              <button
                type="reset"
                className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                aria-label="Vymazať filter"
                onClick={() => setFilterInput('')}
              >
                <X className="size-3" aria-hidden />
              </button>
            ) : null}
          </div>
          <menu
            className="m-0 flex shrink-0 list-none items-center gap-0.5 border-l border-sidebar-border/70 p-0 pl-0.5"
            aria-label="Akcie stromu"
          >
            <li>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition enabled:hover:bg-sidebar-accent enabled:hover:text-foreground disabled:opacity-35"
                aria-label="Rozbaliť všetko"
                title="Rozbaliť všetko"
                onClick={expandAll}
                disabled={expandableIds.length === 0}
              >
                <ChevronsUpDown className="size-3.5" aria-hidden />
              </button>
            </li>
            <li>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition enabled:hover:bg-sidebar-accent enabled:hover:text-foreground disabled:opacity-35"
                aria-label="Zbaliť všetko"
                title="Zbaliť všetko"
                onClick={collapseAll}
                disabled={expandableIds.length === 0}
              >
                <ChevronsDownUp className="size-3.5" aria-hidden />
              </button>
            </li>
          </menu>
        </form>
      </search>

      <nav
        ref={parentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5"
        aria-label="Strom priečinkov"
      >
        <div
          className="relative w-full"
          role="tree"
          aria-label="Priečinky"
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
                    aria-current={
                      activeFolderId === null ? 'page' : undefined
                    }
                    className={cn(
                      'group flex h-[34px] items-center gap-2 rounded-xl px-2 text-sm transition',
                      activeFolderId === null
                        ? 'bg-primary/12 font-medium text-primary ring-1 ring-primary/30 dark:bg-primary/15'
                        : 'text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 shrink-0 items-center justify-center rounded-lg',
                        activeFolderId === null
                          ? 'bg-primary/20 text-primary'
                          : 'bg-sidebar-accent text-muted-foreground group-hover:text-foreground',
                      )}
                      aria-hidden
                    >
                      <HardDrive className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      Všetky súbory
                    </span>
                    <data
                      value={folders.length}
                      className={cn(
                        'shrink-0 rounded-md px-1.5 py-0.5 font-meta text-[10px] tabular-nums',
                        activeFolderId === null
                          ? 'bg-primary/15 text-primary'
                          : 'bg-sidebar-accent/80 text-muted-foreground/80',
                      )}
                    >
                      {folders.length}
                    </data>
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
                aria-expanded={
                  row.hasChildren ? (open[row.id] ?? row.depth < 1) : undefined
                }
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

        {hasFilter && rows.length === 0 ? (
          <output
            className="block px-3 py-5 text-center text-[11px] leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
            Žiadny priečinok pre „{debouncedFilter.trim()}“
          </output>
        ) : null}

        {!hasFilter && folders.length === 0 ? (
          <FolderTreeEmpty />
        ) : null}
      </nav>
    </div>
  )
}

function FolderTreeEmpty() {
  const reduce = useReducedMotion()

  return (
    <motion.aside
      className="mx-1 mt-1 flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-sidebar-border/90 bg-sidebar-accent/20 px-3 py-6 text-center"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Prázdny strom priečinkov"
    >
      <span
        className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25"
        aria-hidden
      >
        <Folders className="size-4" />
      </span>
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-sidebar-foreground">
          Zatiaľ žiadne priečinky
        </h3>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Vytvor prvý v paneli súborov — tu sa objaví strom.
        </p>
      </div>
    </motion.aside>
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
        'group relative flex h-[34px] items-center gap-0.5 rounded-xl transition',
        row.isActive
          ? 'bg-primary/12 font-medium text-primary ring-1 ring-primary/30 dark:bg-primary/15'
          : row.isAncestorOfActive
            ? 'bg-sidebar-accent/50 text-foreground'
            : 'hover:bg-sidebar-accent/75',
      )}
      style={{ paddingLeft: 4 + row.depth * 14 }}
      title={row.pathLabel}
    >
      {row.depth > 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-sidebar-border/70"
          style={{ left: 4 + (row.depth - 1) * 14 + 11 }}
        />
      ) : null}
      <button
        type="button"
        className="relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground disabled:opacity-25"
        aria-label={isOpen ? 'Zbaliť' : 'Rozbaliť'}
        onClick={onToggle}
        disabled={!row.hasChildren}
      >
        {row.hasChildren ? (
          isOpen ? (
            <ChevronDown className="size-3.5" aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden />
          )
        ) : (
          <span className="size-3.5" aria-hidden />
        )}
      </button>
      <Link
        to="/files/$folderId"
        params={{ folderId: row.id }}
        onClick={onNavigate}
        aria-current={row.isActive ? 'page' : undefined}
        className="relative z-[1] flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-sm"
      >
        <FolderIcon
          className={cn(
            'size-3.5 shrink-0',
            row.isActive
              ? 'text-primary'
              : 'text-muted-foreground/90 group-hover:text-foreground',
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{row.name}</span>
        {metaParts.length > 0 ? (
          <small className="hidden shrink-0 font-meta text-[10px] text-muted-foreground/70 tabular-nums group-hover:inline xl:inline">
            {metaParts.join(' · ')}
          </small>
        ) : null}
      </Link>
    </div>
  )
}
