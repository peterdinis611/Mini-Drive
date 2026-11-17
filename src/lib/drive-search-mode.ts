/** Fuzzy (Fuse.js) or RegExp over the same searchable fields. */
export type DriveSearchMode = 'fuzzy' | 'regex'

/** `/pattern/flags` — last slash starts flags; `\` escapes `/` inside pattern. */
const WRAPPED_REGEX = /^\/((?:\\.|[^\\/])*)\/([gimsuy]*)$/

export const DRIVE_REGEX_MAX_PATTERN_LENGTH = 200
export const DRIVE_REGEX_MAX_FLAGS_LENGTH = 6

/**
 * Compile a drive search RegExp.
 * Accepts `/pattern/flags` (flags as written) or a raw pattern (default `iu`).
 * Returns `null` for empty / invalid / oversized patterns.
 */
export function compileDriveRegex(query: string): RegExp | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  if (trimmed.length > DRIVE_REGEX_MAX_PATTERN_LENGTH + 10) return null

  const wrapped = WRAPPED_REGEX.exec(trimmed)
  try {
    if (wrapped) {
      const pattern = wrapped[1]
      const flags = wrapped[2] ?? ''
      if (!pattern) return null
      if (pattern.length > DRIVE_REGEX_MAX_PATTERN_LENGTH) return null
      if (flags.length > DRIVE_REGEX_MAX_FLAGS_LENGTH) return null
      // Reject nested / adjacent quantifiers that commonly cause ReDoS.
      if (/([+*?]|\{\d+,?\d*\})[+*?{]|\)[+*?]/.test(pattern)) {
        return null
      }
      return new RegExp(pattern, flags)
    }
    if (trimmed.startsWith('/') && trimmed.length > 1) return null
    if (trimmed.length > DRIVE_REGEX_MAX_PATTERN_LENGTH) return null
    if (/([+*?]|\{\d+,?\d*\})[+*?{]|\)[+*?]/.test(trimmed)) {
      return null
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
