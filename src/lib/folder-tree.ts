import type { FolderTreeNode } from '#/components/files/types'

export type FolderTreeItem = FolderTreeNode & {
  children: FolderTreeItem[]
  /** Direct child folders */
  childCount: number
  /** Nested path from root, e.g. "Projekty / Q4" */
  pathLabel: string
}

export type FlatFolderRow = {
  id: string
  name: string
  parentId: string | null
  depth: number
  childCount: number
  fileCount: number
  hasChildren: boolean
  pathLabel: string
  isActive: boolean
  isAncestorOfActive: boolean
}

/** Nested tree sorted sk-SK, with path + child counts. */
export function buildFolderTree(folders: FolderTreeNode[]): FolderTreeItem[] {
  const map = new Map<string, FolderTreeItem>()
  for (const folder of folders) {
    map.set(folder.id, {
      ...folder,
      fileCount: folder.fileCount ?? 0,
      children: [],
      childCount: 0,
      pathLabel: folder.name,
    })
  }

  const roots: FolderTreeItem[] = []
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(item)
    } else {
      roots.push(item)
    }
  }

  const decorate = (nodes: FolderTreeItem[], parentPath: string) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'sk'))
    for (const node of nodes) {
      node.pathLabel = parentPath ? `${parentPath} / ${node.name}` : node.name
      node.childCount = node.children.length
      decorate(node.children, node.pathLabel)
    }
  }
  decorate(roots, '')
  return roots
}

/** Ancestor folder ids from root → parent of `folderId` (exclusive of self). */
export function getAncestorFolderIds(
  folderId: string,
  folders: FolderTreeNode[],
): string[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const chain: string[] = []
  let current = byId.get(folderId)?.parentId ?? null
  const seen = new Set<string>()
  while (current && !seen.has(current)) {
    seen.add(current)
    chain.unshift(current)
    current = byId.get(current)?.parentId ?? null
  }
  return chain
}

/**
 * Flatten visible tree rows for virtualization.
 * When `filter` is set, matching nodes stay visible with ancestors forced open.
 */
export function flattenFolderRows(
  tree: FolderTreeItem[],
  options: {
    open: Record<string, boolean>
    activeFolderId: string | null
    filter?: string
    /** Default expand depth when open[id] is undefined */
    defaultOpenDepth?: number
  },
): FlatFolderRow[] {
  const filter = options.filter?.trim().toLocaleLowerCase('sk') ?? ''
  const defaultOpenDepth = options.defaultOpenDepth ?? 1
  const activeAncestors = new Set(
    options.activeFolderId
      ? collectAncestorIdsFromTree(tree, options.activeFolderId)
      : [],
  )

  const rows: FlatFolderRow[] = []

  const visit = (nodes: FolderTreeItem[], depth: number) => {
    for (const node of nodes) {
      const matchesSelf =
        !filter ||
        node.name.toLocaleLowerCase('sk').includes(filter) ||
        node.pathLabel.toLocaleLowerCase('sk').includes(filter)

      const matchingDescendant = filter
        ? hasMatchingDescendant(node, filter)
        : false

      if (filter && !matchesSelf && !matchingDescendant) {
        continue
      }

      const isOpen =
        filter && matchingDescendant
          ? true
          : (options.open[node.id] ?? depth < defaultOpenDepth)

      rows.push({
        id: node.id,
        name: node.name,
        parentId: node.parentId,
        depth,
        childCount: node.childCount,
        fileCount: node.fileCount ?? 0,
        hasChildren: node.childCount > 0,
        pathLabel: node.pathLabel,
        isActive: options.activeFolderId === node.id,
        isAncestorOfActive: activeAncestors.has(node.id),
      })

      if (node.children.length > 0 && isOpen) {
        visit(node.children, depth + 1)
      }
    }
  }

  visit(tree, 0)
  return rows
}

function hasMatchingDescendant(node: FolderTreeItem, filter: string): boolean {
  for (const child of node.children) {
    if (
      child.name.toLocaleLowerCase('sk').includes(filter) ||
      child.pathLabel.toLocaleLowerCase('sk').includes(filter) ||
      hasMatchingDescendant(child, filter)
    ) {
      return true
    }
  }
  return false
}

function collectAncestorIdsFromTree(
  tree: FolderTreeItem[],
  targetId: string,
): string[] {
  const path: string[] = []

  const walk = (nodes: FolderTreeItem[], trail: string[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.push(...trail)
        return true
      }
      if (walk(node.children, [...trail, node.id])) return true
    }
    return false
  }

  walk(tree, [])
  return path
}

/** All folder ids that have children — for expand-all. */
export function collectExpandableFolderIds(tree: FolderTreeItem[]): string[] {
  const ids: string[] = []
  const walk = (nodes: FolderTreeItem[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        ids.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(tree)
  return ids
}
