import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Folder, HardDrive } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { FolderTreeNode } from '#/components/files/types'

type Props = {
  folders: FolderTreeNode[]
  activeFolderId: string | null
  onNavigate?: () => void
}

type TreeItem = FolderTreeNode & { children: TreeItem[] }

export function FolderTree({ folders, activeFolderId, onNavigate }: Props) {
  const tree = useMemo(() => buildTree(folders), [folders])
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-0.5">
      <Link
        to="/files"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
          activeFolderId === null
            ? 'bg-primary/25 font-medium text-foreground dark:bg-primary/20 dark:text-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
        )}
      >
        <HardDrive className="size-4 shrink-0 opacity-70" />
        <span className="truncate">Všetky súbory</span>
      </Link>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          activeFolderId={activeFolderId}
          open={open}
          setOpen={setOpen}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  activeFolderId,
  open,
  setOpen,
  onNavigate,
}: {
  node: TreeItem
  depth: number
  activeFolderId: string | null
  open: Record<string, boolean>
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onNavigate?: () => void
}) {
  const hasChildren = node.children.length > 0
  const isOpen = open[node.id] ?? depth < 1
  const active = activeFolderId === node.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-0.5 rounded-full',
          active
            ? 'bg-primary/25 font-medium text-foreground dark:bg-primary/20 dark:text-primary'
            : 'hover:bg-sidebar-accent/70',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center text-muted-foreground"
          aria-label={isOpen ? 'Zbaliť' : 'Rozbaliť'}
          onClick={() =>
            setOpen((prev) => ({ ...prev, [node.id]: !isOpen }))
          }
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="size-3.5" />
          )}
        </button>
        <Link
          to="/files/$folderId"
          params={{ folderId: node.id }}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-sm"
        >
          <Folder className="size-4 shrink-0 opacity-80" />
          <span className="truncate">{node.name}</span>
        </Link>
      </div>
      {hasChildren && isOpen
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              open={open}
              setOpen={setOpen}
              onNavigate={onNavigate}
            />
          ))
        : null}
    </div>
  )
}

function buildTree(folders: FolderTreeNode[]): TreeItem[] {
  const map = new Map<string, TreeItem>()
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] })
  }
  const roots: TreeItem[] = []
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(item)
    } else {
      roots.push(item)
    }
  }
  const sortRecursive = (nodes: TreeItem[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'sk'))
    for (const node of nodes) sortRecursive(node.children)
  }
  sortRecursive(roots)
  return roots
}
