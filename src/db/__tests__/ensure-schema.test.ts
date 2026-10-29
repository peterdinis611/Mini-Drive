import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { ensureSqliteSchema } from '#/db/ensure-schema'

function columnNames(sqlite: Database.Database) {
  return (
    sqlite.prepare(`PRAGMA table_info("user")`).all() as Array<{ name: string }>
  ).map((row) => row.name)
}

describe('ensureSqliteSchema', () => {
  let sqlite: Database.Database

  afterEach(() => {
    sqlite?.close()
  })

  it('is a no-op when user table is missing', () => {
    sqlite = new Database(':memory:')
    expect(() => ensureSqliteSchema(sqlite)).not.toThrow()
    expect(columnNames(sqlite)).toEqual([])
  })

  it('adds email_verified and preference columns to a legacy user table', () => {
    sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE "user" (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL
      );
    `)

    ensureSqliteSchema(sqlite)

    const cols = columnNames(sqlite)
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
      ]),
    )

    sqlite
      .prepare(`INSERT INTO "user" (id, name, email) VALUES (?, ?, ?)`)
      .run('u1', 'Peter', 'peter@example.com')

    const row = sqlite
      .prepare(
        `SELECT email_verified, theme_preference, confirm_delete FROM "user" WHERE id = ?`,
      )
      .get('u1') as {
      email_verified: number
      theme_preference: string
      confirm_delete: number
    }

    expect(row.email_verified).toBe(0)
    expect(row.theme_preference).toBe('system')
    expect(row.confirm_delete).toBe(1)
  })

  it('is idempotent when columns already exist', () => {
    sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE "user" (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL,
        email_verified integer NOT NULL DEFAULT 0,
        theme_preference text NOT NULL DEFAULT 'system',
        default_share_expires_in integer NOT NULL DEFAULT 3600,
        confirm_delete integer NOT NULL DEFAULT 1,
        view_preference text NOT NULL DEFAULT 'list',
        onboarding_step integer NOT NULL DEFAULT 1,
        onboarded_at integer,
        image text
      );
    `)

    const before = columnNames(sqlite)
    ensureSqliteSchema(sqlite)
    ensureSqliteSchema(sqlite)
    expect(columnNames(sqlite)).toEqual(before)
  })
})
