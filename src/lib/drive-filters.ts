import Fuse from 'fuse.js'

import { type FileKind, getFileKind } from '#/lib/file-kind'
import { DRIVE_FUSE_OPTIONS } from '#/lib/fuse-options'

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
  const q = query.trim()
  if (!q) return folders

  const fuse = new Fuse(folders, {
    ...DRIVE_FUSE_OPTIONS,
    keys: [{ name: 'name', weight: 1 }],
  })
  return fuse.search(q).map((result) => result.item)
}

export function filterDriveFiles<T extends FilterableFile>(
  files: T[],
  kind: DriveKindFilter,
  query: string,
): T[] {
  const kindFiltered =
    kind === 'all'
      ? files
      : files.filter((file) =>
          matchesKindFilter(getFileKind(file.mimeType, file.name), kind),
        )

  const q = query.trim()
  if (!q) return kindFiltered

  const fuse = new Fuse(kindFiltered, {
    ...DRIVE_FUSE_OPTIONS,
    keys: [
      { name: 'name', weight: 0.85 },
      { name: 'mimeType', weight: 0.15 },
    ],
  })
  return fuse.search(q).map((result) => result.item)
}

function matchesKindFilter(fileKind: FileKind, kind: DriveKindFilter): boolean {
  if (kind === 'all') return true
  if (kind === 'text') return fileKind === 'text' || fileKind === 'code'
  return fileKind === kind
}
