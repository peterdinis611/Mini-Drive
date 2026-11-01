/** Fuzzy (Fuse.js) or RegExp over the same searchable fields. */
export type DriveSearchMode = 'fuzzy' | 'regex'

/** `/pattern/flags` — last slash starts flags; `\` escapes `/` inside pattern. */
const WRAPPED_REGEX = /^\/((?:\\.|[^\\/])+)\/([gimsuy]*)$/

/**
 * Compile a drive search RegExp.
 * Accepts `/pattern/flags` or a raw pattern (default flags: `iu`).
 * Returns `null` for empty / invalid patterns.
 */
export function compileDriveRegex(query: string): RegExp | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  const wrapped = WRAPPED_REGEX.exec(trimmed)
  try {
    if (wrapped) {
      return new RegExp(wrapped[1], wrapped[2] || 'iu')
    }
    return new RegExp(trimmed, 'iu')
  } catch {
    return null
  }
}

export function fieldsMatchRegex(
  fields: Array<string | null | undefined>,
  re: RegExp,
): boolean {
  return fields.some((field) => field != null && field !== '' && re.test(field))
}
