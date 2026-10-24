/**
 * Encrypted SQLite backup (AES-256-GCM).
 *
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:backup
 *   BACKUP_ENCRYPTION_KEY=... pnpm db:backup -- --out backups/manual.db.enc
 */
import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'

import {
  defaultBackupFileName,
  encryptDbBackup,
} from '../src/lib/db-backup'

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
const databaseUrl = process.env.DATABASE_URL ?? 'dev.db'
if (databaseUrl === ':memory:') {
  throw new Error('Nemôžem zálohovať :memory: databázu')
}

const dbPath = resolve(process.cwd(), databaseUrl)
const outArg = parseOutArg(process.argv.slice(2))
const outPath = resolve(
  process.cwd(),
  outArg ?? resolve('backups', defaultBackupFileName()),
)

mkdirSync(dirname(outPath), { recursive: true })

const tmp = resolve(tmpdir(), `mini-drive-backup-${randomUUID()}.db`)
try {
  copyFileSync(dbPath, tmp)
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

console.log(`Encrypted backup → ${outPath}`)
