export type PreviewShellProps = {
  url: string
  fileName: string
  mimeType: string
  fileSize: number
  /** When set, image toolbar can mint a public safe-url share. */
  fileId?: string
  /** Folder of the file — used when crop „uložiť ako“ creates a sibling. */
  folderId?: string | null
  onRequestShare?: () => void
  /** Called after crop is saved back to Drive (replace or save-as). */
  onSavedToDrive?: () => void
}

export type ThemePreference = 'light' | 'dark'
