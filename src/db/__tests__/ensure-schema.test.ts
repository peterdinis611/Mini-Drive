import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ensurePgSchema } from '#/db/ensure-schema'

const databaseUrl = process.env.TEST_DATABASE_URL?.trim()
const describePg = databaseUrl ? describe : describe.skip

describePg('ensurePgSchema', () => {
  let pool: Pool

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl })
  })

  afterAll(async () => {
    await pool?.end()
  })

  it('is a no-op when user table is missing', async () => {
    await pool.query('DROP TABLE IF EXISTS "user" CASCADE')
    await expect(ensurePgSchema(pool)).resolves.toBeUndefined()
  })

  it('adds preference columns to a legacy user table', async () => {
    await pool.query('DROP TABLE IF EXISTS "user" CASCADE')
    await pool.query(`
      CREATE TABLE "user" (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL
      );
    `)

    await ensurePgSchema(pool)

    const result = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'user'`,
    )
    const cols = result.rows.map((row) => row.column_name)
    expect(cols).toEqual(
      expect.arrayContaining([
        'email_verified',
        'theme_preference',
        'default_share_expires_in',
        'confirm_delete',
        'view_preference',
        'onboarding_step',
        'onboarded_at',
        'image',
        'custom_hotkeys',
        'last_folder_id',
      ]),
    )
  })
})
