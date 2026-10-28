/**
 * Apply rename pattern to a file name.
 * Tokens: `{n}` index, `{name}` basename without ext, `{ext}` extension with dot.
 */
export function applyRenamePattern(
  originalName: string,
  pattern: string,
  index: number,
): string {
  const lastDot = originalName.lastIndexOf('.')
  const hasExt = lastDot > 0
  const base = hasExt ? originalName.slice(0, lastDot) : originalName
  const ext = hasExt ? originalName.slice(lastDot) : ''

  return pattern
    .replaceAll('{n}', String(index))
    .replaceAll('{name}', base)
    .replaceAll('{ext}', ext)
}
