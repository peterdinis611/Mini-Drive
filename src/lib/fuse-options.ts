import type { IFuseOptions } from 'fuse.js'

/** Shared Fuse defaults for Drive search UIs (⌘K, explorer, folder tree). */
export const DRIVE_FUSE_OPTIONS = {
  threshold: 0.38,
  ignoreLocation: true,
  ignoreDiacritics: true,
  includeScore: true,
  minMatchCharLength: 1,
} as const satisfies IFuseOptions<unknown>
