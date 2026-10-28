/**
 * Decrypt an encrypted SQLite backup.
 *
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:restore -- backups/foo.db.enc
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:restore -- backups/foo.db.enc --out restored.db
 */
import { config } from 'dotenv'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { decryptDbBackup } from '../src/lib/db-backup'
import { getFileBytesSync } from '../src/lib/file-bytes'
import { formatFileSize } from '../src/lib/format'

config({ path: ['.env.local', '.env'] })

function resolvePassphrase(): string {
  const key = process.env.BACKUP_ENCRYPTION_KEY?.trim()
  if (!key) {
    throw new Error(
      'Nastav BACKUP_ENCRYPTION_KEY (min. 16 znakov) pred db:restore',
    )
  }
  return key
}

function parseArgs(argv: string[]): { input: string; out: string } {
  const outIdx = argv.indexOf('--out')
  let out = 'restored.db'
  const rest = [...argv]
  if (outIdx >= 0) {
    const value = rest[outIdx + 1]
    if (!value) throw new Error('Chýba cesta za --out')
    out = value
    rest.splice(outIdx, 2)
  }
  const input = rest.find((a) => !a.startsWith('-'))
  if (!input) {
    throw new Error(
      'Použitie: pnpm db:restore -- <backup.db.enc> [--out restored.db]',
    )
  }
  return { input, out }
}

const passphrase = resolvePassphrase()
const { input, out } = parseArgs(process.argv.slice(2))
const inPath = resolve(process.cwd(), input)
const outPath = resolve(process.cwd(), out)

const archiveBytes = getFileBytesSync(inPath)
const blob = readFileSync(inPath)
const plaintext = decryptDbBackup(blob, passphrase)

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, plaintext)

const restoredBytes = getFileBytesSync(outPath)
console.log(
  `Restored DB → ${outPath} (${formatFileSize(archiveBytes)} → ${formatFileSize(restoredBytes)})`,
)
