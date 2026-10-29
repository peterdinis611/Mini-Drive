import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { ensureSqliteSchema } from './ensure-schema'
import * as schema from './schema'

// Resolve from project root — after `vite build`, import.meta.url points at
// dist/server/assets/* and cannot see node_modules/better-sqlite3.
const require = createRequire(join(process.cwd(), 'package.json'))
const Database = require('better-sqlite3') as typeof import('better-sqlite3')
const nativeBinding = require.resolve(
  'better-sqlite3/build/Release/better_sqlite3.node',
)

config({ path: ['.env.local', '.env'] })

const databaseUrl = (process.env.DATABASE_URL ?? 'dev.db').trim()
const dbPath =
  databaseUrl === ':memory:' ? ':memory:' : resolve(process.cwd(), databaseUrl)

if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true })
}

const sqlite = new Database(dbPath, { nativeBinding })
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
ensureSqliteSchema(sqlite)

export const db = drizzle(sqlite, { schema })
export { sqlite }
