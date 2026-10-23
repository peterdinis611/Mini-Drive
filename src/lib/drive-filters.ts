import { getFileKind, type FileKind } from '#/lib/file-kind'

export type DriveKindFilter =
  | 'all'
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'text'

export type FilterableFile = {
  id: string
  name: string
  mimeType: string
}

export type FilterableFolder = {
  id: string
  name: string
}

/** Kind chips hide folders unless filter is `all`. */
export function filterDriveFolders<T extends FilterableFolder>(
  folders: T[],
  kind: DriveKindFilter,
  query: string,
): T[] {
  if (kind !== 'all') return []
  const q = query.trim().toLowerCase()
  if (!q) return folders
  return folders.filter((folder) => folder.name.toLowerCase().includes(q))
}

export function filterDriveFiles<T extends FilterableFile>(
  files: T[],
  kind: DriveKindFilter,
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  return files.filter((file) => {
    if (kind !== 'all') {
      const fileKind = getFileKind(file.mimeType, file.name)
      if (!matchesKindFilter(fileKind, kind)) return false
    }
    if (q && !file.name.toLowerCase().includes(q)) return false
    return true
  })
}

function matchesKindFilter(fileKind: FileKind, kind: DriveKindFilter): boolean {
  if (kind === 'all') return true
  if (kind === 'text') return fileKind === 'text' || fileKind === 'code'
  return fileKind === kind
}
