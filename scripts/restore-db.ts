/**
 * Decrypt an encrypted Postgres dump and restore with `pg_restore`.
 *
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:restore -- backups/foo.dump.enc
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:restore -- backups/foo.dump.enc --url postgresql://...
 */

import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { config } from 'dotenv'

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

function parseArgs(argv: string[]): { input: string; url: string } {
  const urlIdx = argv.indexOf('--url')
  let url = (process.env.DATABASE_URL ?? '').trim()
  const rest = [...argv]
  if (urlIdx >= 0) {
    const value = rest[urlIdx + 1]
    if (!value) throw new Error('Chýba connection string za --url')
    url = value
    rest.splice(urlIdx, 2)
  }
  const input = rest.find((a) => !a.startsWith('-'))
  if (!input) {
    throw new Error(
      'Použitie: pnpm db:restore -- <backup.dump.enc> [--url postgresql://…]',
    )
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL / --url must be a postgresql:// URL')
  }
  return { input, url }
}

const passphrase = resolvePassphrase()
const { input, url } = parseArgs(process.argv.slice(2))
const inPath = resolve(process.cwd(), input)

const archiveBytes = getFileBytesSync(inPath)
const blob = readFileSync(inPath)
const plaintext = decryptDbBackup(blob, passphrase)

const tmp = resolve(tmpdir(), `mini-drive-restore-${randomUUID()}.dump`)
try {
  writeFileSync(tmp, plaintext)
  execFileSync(
    'pg_restore',
    ['--clean', '--if-exists', '--no-owner', `--dbname=${url}`, tmp],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
} finally {
  try {
    unlinkSync(tmp)
  } catch {
    // ignore
  }
}

console.log(
  `Restored Postgres dump (${formatFileSize(archiveBytes)} archive) → ${url}`,
)
