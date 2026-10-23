export type PreviewShellProps = {
  url: string
  fileName: string
  mimeType: string
  fileSize: number
  /** When set, image toolbar can mint a public safe-url share. */
  fileId?: string
  onRequestShare?: () => void
}

export type ThemePreference = 'light' | 'dark'
