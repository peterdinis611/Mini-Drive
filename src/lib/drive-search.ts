import Fuse from 'fuse.js'

export type DriveSearchFolder = {
  id: string
  parentId: string | null
  name: string
}

export type DriveSearchFile = {
  id: string
  name: string
  size: number
  mimeType: string
  folderId: string | null
}

export type DriveSearchItem =
  | {
      kind: 'folder'
      id: string
      name: string
      parentId: string | null
      pathLabel: string
    }
  | {
      kind: 'file'
      id: string
      name: string
      mimeType: string
      folderId: string | null
      size: number
      pathLabel: string
    }

function buildFolderPath(
  folderId: string | null,
  foldersById: Map<string, DriveSearchFolder>,
): string {
  if (!folderId) return 'Súbory'

  const parts: string[] = []
  let current: string | null = folderId
  const seen = new Set<string>()

  while (current && !seen.has(current)) {
    seen.add(current)
    const folder = foldersById.get(current)
    if (!folder) break
    parts.unshift(folder.name)
    current = folder.parentId
  }

  return parts.length > 0 ? `Súbory / ${parts.join(' / ')}` : 'Súbory'
}

export function buildDriveSearchItems(
  folders: DriveSearchFolder[],
  files: DriveSearchFile[],
): DriveSearchItem[] {
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]))

  const folderItems: DriveSearchItem[] = folders.map((folder) => ({
    kind: 'folder',
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    pathLabel: buildFolderPath(folder.parentId, foldersById),
  }))

  const fileItems: DriveSearchItem[] = files.map((file) => ({
    kind: 'file',
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    folderId: file.folderId,
    size: file.size,
    pathLabel: buildFolderPath(file.folderId, foldersById),
  }))

  return [...folderItems, ...fileItems]
}

export function createDriveFuse(items: DriveSearchItem[]) {
  return new Fuse(items, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'pathLabel', weight: 0.2 },
      { name: 'mimeType', weight: 0.1 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 1,
  })
}

export function searchDriveItems(
  fuse: Fuse<DriveSearchItem>,
  items: DriveSearchItem[],
  query: string,
  limit = 24,
): DriveSearchItem[] {
  const q = query.trim()
  if (!q) {
    return items.slice(0, limit)
  }
  return fuse.search(q, { limit }).map((result) => result.item)
}
