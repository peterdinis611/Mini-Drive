import { wouldCreateFolderCycle } from './validation'

export type FolderNode = {
  id: string
  parentId: string | null
  name: string
}

export function buildParentMap(
  nodes: FolderNode[],
): Map<string, string | null> {
  return new Map(nodes.map((node) => [node.id, node.parentId]))
}

export function collectDescendantIds(
  folderId: string,
  nodes: FolderNode[],
): string[] {
  const childrenByParent = new Map<string | null, string[]>()
  for (const node of nodes) {
    const key = node.parentId
    const list = childrenByParent.get(key) ?? []
    list.push(node.id)
    childrenByParent.set(key, list)
  }

  const result: string[] = []
  const stack = [folderId]

  while (stack.length > 0) {
    const current = stack.pop()!
    result.push(current)
    const children = childrenByParent.get(current) ?? []
    for (const child of children) stack.push(child)
  }

  return result
}

export function canMoveFolder(
  folderId: string,
  newParentId: string | null,
  nodes: FolderNode[],
): boolean {
  return !wouldCreateFolderCycle(folderId, newParentId, buildParentMap(nodes))
}

export function buildBreadcrumbs(
  folderId: string | null,
  nodes: FolderNode[],
): Array<{ id: string | null; name: string }> {
  const crumbs: Array<{ id: string | null; name: string }> = [
    { id: null, name: 'Súbory' },
  ]
  if (!folderId) return crumbs

  const byId = new Map(nodes.map((node) => [node.id, node]))
  const trail: FolderNode[] = []
  let current: FolderNode | undefined = byId.get(folderId)

  while (current) {
    trail.push(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  trail.reverse()
  for (const node of trail) {
    crumbs.push({ id: node.id, name: node.name })
  }

  return crumbs
}

/** Human path like "Projekty / Q1" for folder pickers. */
export function formatFolderPath(
  folder: FolderNode,
  all: FolderNode[],
): string {
  const byId = new Map(all.map((item) => [item.id, item]))
  const parts: string[] = [folder.name]
  let parentId = folder.parentId
  while (parentId) {
    const parent = byId.get(parentId)
    if (!parent) break
    parts.unshift(parent.name)
    parentId = parent.parentId
  }
  return parts.join(' / ')
}
