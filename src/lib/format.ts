const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  )
  const value = bytes / 1024 ** exponent
  const formatted =
    value >= 10 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)

  return `${formatted} ${UNITS[exponent]}`
}
