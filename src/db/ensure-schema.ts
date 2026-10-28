import type Database from 'better-sqlite3'

/** Lightweight additive migrations for local SQLite (dev / single-node). */
export function ensureSqliteSchema(sqlite: Database.Database) {
  const userCols = new Set(
    (
      sqlite.prepare(`PRAGMA table_info("user")`).all() as Array<{
        name: string
      }>
    ).map((row) => row.name),
  )

  if (userCols.size === 0) return

  const addUserColumn = (name: string, ddl: string) => {
    if (userCols.has(name)) return
    sqlite.exec(`ALTER TABLE "user" ADD COLUMN ${ddl}`)
    userCols.add(name)
  }

  addUserColumn(
    'email_verified',
    `"email_verified" integer NOT NULL DEFAULT 0`,
  )
  addUserColumn(
    'theme_preference',
    `"theme_preference" text NOT NULL DEFAULT 'system'`,
  )
  addUserColumn(
    'default_share_expires_in',
    `"default_share_expires_in" integer NOT NULL DEFAULT 3600`,
  )
  addUserColumn(
    'confirm_delete',
    `"confirm_delete" integer NOT NULL DEFAULT 1`,
  )
  addUserColumn(
    'view_preference',
    `"view_preference" text NOT NULL DEFAULT 'list'`,
  )
  addUserColumn(
    'onboarding_step',
    `"onboarding_step" integer NOT NULL DEFAULT 1`,
  )
  addUserColumn('onboarded_at', `"onboarded_at" integer`)
  addUserColumn('image', `"image" text`)
}
