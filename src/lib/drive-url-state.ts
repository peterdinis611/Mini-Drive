import { parseAsBoolean, parseAsString, parseAsStringLiteral } from 'nuqs'

export const viewParser = parseAsStringLiteral(['grid', 'list'] as const)

export const kindFilterParser = parseAsStringLiteral([
  'all',
  'image',
  'pdf',
  'video',
  'audio',
  'text',
] as const).withDefault('all')

export const previewIdParser = parseAsString

export const qParser = parseAsString.withDefault('')

export const uploadOpenParser = parseAsBoolean.withDefault(true)

/** RegExp filter mode for explorer `q` (Fuse fuzzy when false). */
export const regexSearchParser = parseAsBoolean.withDefault(false)

export const driveSearchParams = {
  view: viewParser,
  kind: kindFilterParser,
  preview: previewIdParser,
  q: qParser,
  upload: uploadOpenParser,
  re: regexSearchParser,
}
