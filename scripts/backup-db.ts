/**
 * Encrypted Postgres dump (AES-256-GCM around `pg_dump -Fc`).
 *
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:backup
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:backup -- --out backups/manual.dump.enc
 */

import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { config } from 'dotenv'

import { defaultBackupFileName, encryptDbBackup } from '../src/lib/db-backup'
import { getFileBytesSync } from '../src/lib/file-bytes'
import { formatFileSize } from '../src/lib/format'

config({ path: ['.env.local', '.env'] })

function resolvePassphrase(): string {
  const key = process.env.BACKUP_ENCRYPTION_KEY?.trim()
  if (!key) {
    throw new Error(
      'Nastav BACKUP_ENCRYPTION_KEY (min. 16 znakov) pred db:backup',
    )
  }
  return key
}

function parseOutArg(argv: string[]): string | null {
  const idx = argv.indexOf('--out')
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1]!
  return null
}

const passphrase = resolvePassphrase()
const databaseUrl = (process.env.DATABASE_URL ?? '').trim()
if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('DATABASE_URL must be a postgresql:// URL for db:backup')
}

const outArg = parseOutArg(process.argv.slice(2))
const outPath = resolve(
  process.cwd(),
  outArg ?? resolve('backups', defaultBackupFileName()),
)

mkdirSync(dirname(outPath), { recursive: true })

const tmp = resolve(tmpdir(), `mini-drive-backup-${randomUUID()}.dump`)
try {
  execFileSync('pg_dump', ['--format=custom', `--file=${tmp}`, databaseUrl], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  const plaintext = readFileSync(tmp)
  const { blob } = encryptDbBackup(plaintext, passphrase)
  writeFileSync(outPath, blob)
} finally {
  try {
    unlinkSync(tmp)
  } catch {
    // ignore
  }
}

const backupBytes = getFileBytesSync(outPath)
console.log(
  `Encrypted Postgres backup → ${outPath} (${formatFileSize(backupBytes)})`,
)
