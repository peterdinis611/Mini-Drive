import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { rekeyUserId } from '#/db/rekey-user'

const databaseUrl = process.env.TEST_DATABASE_URL?.trim()
const describePg = databaseUrl ? describe : describe.skip

describePg('rekeyUserId', () => {
  let pool: Pool

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl })
  })

  afterAll(async () => {
    await pool?.end()
  })

  beforeEach(async () => {
    await pool.query(`
      DROP TABLE IF EXISTS "share_links" CASCADE;
      DROP TABLE IF EXISTS "files" CASCADE;
      DROP TABLE IF EXISTS "folders" CASCADE;
      DROP TABLE IF EXISTS "session" CASCADE;
      DROP TABLE IF EXISTS "account" CASCADE;
      DROP TABLE IF EXISTS "user" CASCADE;

      CREATE TABLE "user" (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL,
        email_verified boolean NOT NULL DEFAULT false,
        image text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        onboarded_at timestamptz,
        view_preference text NOT NULL DEFAULT 'list',
        theme_preference text NOT NULL DEFAULT 'system',
        default_share_expires_in integer NOT NULL DEFAULT 3600,
        confirm_delete boolean NOT NULL DEFAULT true,
        onboarding_step integer NOT NULL DEFAULT 1,
        custom_hotkeys text,
        last_folder_id text
      );
      CREATE TABLE "folders" (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE cascade,
        name text NOT NULL
      );
      CREATE TABLE "files" (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE cascade,
        name text NOT NULL
      );
      CREATE TABLE "share_links" (
        id text PRIMARY KEY,
        created_by text NOT NULL REFERENCES "user"(id) ON DELETE cascade
      );
      CREATE TABLE "session" (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE cascade
      );
      CREATE TABLE "account" (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE cascade
      );
    `)

    await pool.query(
      `INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)`,
      ['legacy_id', 'Legacy', 'legacy@example.com'],
    )
    await pool.query(
      `INSERT INTO folders (id, user_id, name) VALUES ('f1', 'legacy_id', 'Docs')`,
    )
    await pool.query(
      `INSERT INTO files (id, user_id, name) VALUES ('file1', 'legacy_id', 'a.txt')`,
    )
    await pool.query(
      `INSERT INTO share_links (id, created_by) VALUES ('s1', 'legacy_id')`,
    )
    await pool.query(
      `INSERT INTO session (id, user_id) VALUES ('sess1', 'legacy_id')`,
    )
    await pool.query(
      `INSERT INTO account (id, user_id) VALUES ('acc1', 'legacy_id')`,
    )
  })

  it('no-ops when ids match', async () => {
    await rekeyUserId(pool, 'legacy_id', 'legacy_id')
    const row = await pool.query(`SELECT id FROM "user" WHERE id = 'legacy_id'`)
    expect(row.rows).toHaveLength(1)
  })

  it('rewires ownership to the Clerk id', async () => {
    const clerkId = 'user_clerk_123'
    await rekeyUserId(pool, 'legacy_id', clerkId)

    expect(
      (await pool.query(`SELECT id FROM "user" WHERE id = $1`, [clerkId])).rows,
    ).toHaveLength(1)
    expect(
      (await pool.query(`SELECT id FROM "user" WHERE id = 'legacy_id'`)).rows,
    ).toHaveLength(0)
    expect(
      (await pool.query(`SELECT user_id FROM folders WHERE id = 'f1'`)).rows[0]
        ?.user_id,
    ).toBe(clerkId)
    expect(
      (await pool.query(`SELECT user_id FROM files WHERE id = 'file1'`)).rows[0]
        ?.user_id,
    ).toBe(clerkId)
    expect(
      (await pool.query(`SELECT created_by FROM share_links WHERE id = 's1'`))
        .rows[0]?.created_by,
    ).toBe(clerkId)
  })
})
