import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { rekeyUserId } from '#/db/rekey-user'

describe('rekeyUserId', () => {
  let sqlite: Database.Database

  afterEach(() => {
    sqlite?.close()
  })

  function seed() {
    sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE "user" (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL UNIQUE
      );
      CREATE TABLE folders (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        name text NOT NULL
      );
      CREATE TABLE files (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        name text NOT NULL
      );
      CREATE TABLE share_links (
        id text PRIMARY KEY NOT NULL,
        created_by text NOT NULL
      );
      CREATE TABLE session (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL
      );
      CREATE TABLE account (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL
      );
    `)

    sqlite
      .prepare(`INSERT INTO "user" (id, name, email) VALUES (?, ?, ?)`)
      .run('legacy_id', 'Peter', 'peter@example.com')
    sqlite
      .prepare(`INSERT INTO folders (id, user_id, name) VALUES (?, ?, ?)`)
      .run('f1', 'legacy_id', 'Docs')
    sqlite
      .prepare(`INSERT INTO files (id, user_id, name) VALUES (?, ?, ?)`)
      .run('file1', 'legacy_id', 'a.txt')
    sqlite
      .prepare(`INSERT INTO share_links (id, created_by) VALUES (?, ?)`)
      .run('s1', 'legacy_id')
    sqlite
      .prepare(`INSERT INTO session (id, user_id) VALUES (?, ?)`)
      .run('sess1', 'legacy_id')
    sqlite
      .prepare(`INSERT INTO account (id, user_id) VALUES (?, ?)`)
      .run('acc1', 'legacy_id')
  }

  it('no-ops when ids are equal', () => {
    seed()
    rekeyUserId(sqlite, 'legacy_id', 'legacy_id')
    const row = sqlite
      .prepare(`SELECT id FROM "user" WHERE email = ?`)
      .get('peter@example.com') as { id: string }
    expect(row.id).toBe('legacy_id')
  })

  it('rewrites user PK and ownership foreign keys to Clerk id', () => {
    seed()
    const clerkId = 'user_clerk_abc'

    rekeyUserId(sqlite, 'legacy_id', clerkId)

    expect(
      (
        sqlite.prepare(`SELECT id FROM "user" WHERE email = ?`).get(
          'peter@example.com',
        ) as { id: string }
      ).id,
    ).toBe(clerkId)

    expect(
      (
        sqlite.prepare(`SELECT user_id FROM folders WHERE id = ?`).get('f1') as {
          user_id: string
        }
      ).user_id,
    ).toBe(clerkId)

    expect(
      (
        sqlite.prepare(`SELECT user_id FROM files WHERE id = ?`).get(
          'file1',
        ) as { user_id: string }
      ).user_id,
    ).toBe(clerkId)

    expect(
      (
        sqlite.prepare(`SELECT created_by FROM share_links WHERE id = ?`).get(
          's1',
        ) as { created_by: string }
      ).created_by,
    ).toBe(clerkId)

    expect(
      (
        sqlite.prepare(`SELECT user_id FROM session WHERE id = ?`).get(
          'sess1',
        ) as { user_id: string }
      ).user_id,
    ).toBe(clerkId)

    expect(
      (
        sqlite.prepare(`SELECT user_id FROM account WHERE id = ?`).get(
          'acc1',
        ) as { user_id: string }
      ).user_id,
    ).toBe(clerkId)

    expect(
      sqlite.prepare(`SELECT COUNT(*) AS c FROM "user" WHERE id = ?`).get(
        'legacy_id',
      ) as { c: number },
    ).toEqual({ c: 0 })
  })
})
