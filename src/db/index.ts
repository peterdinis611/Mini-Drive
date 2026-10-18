import Database from 'better-sqlite3'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import * as schema from './schema'

config({ path: ['.env.local', '.env'] })

const databaseUrl = process.env.DATABASE_URL ?? 'dev.db'
const dbPath =
  databaseUrl === ':memory:' ? ':memory:' : resolve(process.cwd(), databaseUrl)

if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
