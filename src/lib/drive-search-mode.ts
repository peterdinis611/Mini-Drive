/** Fuzzy (Fuse.js) or RegExp over the same searchable fields. */
export type DriveSearchMode = 'fuzzy' | 'regex'

/** `/pattern/flags` — last slash starts flags; `\` escapes `/` inside pattern. */
const WRAPPED_REGEX = /^\/((?:\\.|[^\\/])*)\/([gimsuy]*)$/

/**
 * Compile a drive search RegExp.
 * Accepts `/pattern/flags` (flags as written) or a raw pattern (default `iu`).
 * Returns `null` for empty / invalid patterns.
 */
export function compileDriveRegex(query: string): RegExp | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  const wrapped = WRAPPED_REGEX.exec(trimmed)
  try {
    if (wrapped) {
      const pattern = wrapped[1]
      if (!pattern) return null
      return new RegExp(pattern, wrapped[2])
    }
    // Looks like `/…` form but incomplete → don't treat as raw text
    if (trimmed.startsWith('/') && trimmed.length > 1) return null
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
