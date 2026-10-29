import type Database from 'better-sqlite3'

/**
 * Migrate a legacy user row (e.g. better-auth id) to a Clerk user id.
 * Updates PK + ownership FKs so existing files stay linked.
 */
export function rekeyUserId(
  sqlite: Database.Database,
  oldId: string,
  newId: string,
) {
  if (oldId === newId) return

  sqlite.pragma('foreign_keys = OFF')
  try {
    const tx = sqlite.transaction(() => {
      sqlite.prepare(`UPDATE "user" SET id = ? WHERE id = ?`).run(newId, oldId)
      sqlite
        .prepare(`UPDATE folders SET user_id = ? WHERE user_id = ?`)
        .run(newId, oldId)
      sqlite
        .prepare(`UPDATE files SET user_id = ? WHERE user_id = ?`)
        .run(newId, oldId)
      sqlite
        .prepare(`UPDATE share_links SET created_by = ? WHERE created_by = ?`)
        .run(newId, oldId)
      sqlite
        .prepare(`UPDATE session SET user_id = ? WHERE user_id = ?`)
        .run(newId, oldId)
      sqlite
        .prepare(`UPDATE account SET user_id = ? WHERE user_id = ?`)
        .run(newId, oldId)
    })
    tx()
  } finally {
    sqlite.pragma('foreign_keys = ON')
  }
}
