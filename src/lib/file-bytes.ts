import { createRequire } from 'node:module'

/**
 * Typed ESM bridge for the CJS `file-bytes` package
 * (disk file size in bytes — sync + promise).
 */
type FileBytesApi = {
  (filename: string): Promise<number>
  sync: (filename: string) => number
}

const require = createRequire(import.meta.url)
const fileBytes = require('file-bytes') as FileBytesApi

/** Async file size in bytes (fs.stat). */
export function getFileBytes(filename: string): Promise<number> {
  return fileBytes(filename)
}

/** Sync file size in bytes (fs.statSync). */
export function getFileBytesSync(filename: string): number {
  return fileBytes.sync(filename)
}
