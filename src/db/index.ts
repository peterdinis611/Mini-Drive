import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { ensurePgSchema } from './ensure-schema'
import * as schema from './schema'

config({ path: ['.env.local', '.env'] })

const isBundling =
  process.env.npm_lifecycle_event === 'build' || process.env.VITEST === 'true'

const databaseUrl =
  (process.env.DATABASE_URL ?? '').trim() ||
  (isBundling ? 'postgresql://127.0.0.1:5432/vite_build_placeholder' : '')

if (!databaseUrl) {
  throw new Error(
    '[mini-drive] DATABASE_URL is required (postgresql://user:pass@host:5432/db).',
  )
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  throw new Error(
    `[mini-drive] DATABASE_URL must be a PostgreSQL URL (got ${databaseUrl}).`,
  )
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
})

pool.on('error', (error) => {
  console.error('[mini-drive] unexpected Postgres pool error', error)
})

/** Boot-time additive schema patches (dev / single-node). */
let schemaBootError: unknown

const schemaReady =
  isBundling && !(process.env.DATABASE_URL ?? '').trim()
    ? Promise.resolve()
    : ensurePgSchema(pool).catch((error) => {
        // Keep the process alive — health / waitForDb surface the failure.
        // Rethrowing here caused unhandledRejection crashes under Node 22+.
        console.error('[mini-drive] ensurePgSchema failed', error)
        schemaBootError = error
      })

export async function waitForDb(): Promise<void> {
  await schemaReady
  if (schemaBootError) throw schemaBootError
}

export const db = drizzle(pool, { schema })
