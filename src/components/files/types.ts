export type DriveFile = {
  id: string
  name: string
  size: number
  mimeType: string
  folderId: string | null
  createdAt: Date | string | number
}

export type DriveFolder = {
  id: string
  name: string
  parentId: string | null
  createdAt?: Date | string | number
}

export type BreadcrumbItem = {
  id: string | null
  name: string
}

export type FolderTreeNode = {
  id: string
  parentId: string | null
  name: string
  /** Direct (non-trashed) files in this folder — optional for legacy callers */
  fileCount?: number
}
