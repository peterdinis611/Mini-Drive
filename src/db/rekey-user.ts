import type { Pool } from 'pg'

/**
 * Migrate a legacy user row (e.g. better-auth id) to a Clerk user id.
 * Copies the user under the new PK, rewires ownership FKs, then deletes the old row.
 */
export async function rekeyUserId(
  pool: Pool,
  oldId: string,
  newId: string,
): Promise<void> {
  if (oldId === newId) return

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "user" (
         id, name, email, email_verified, image, created_at, updated_at,
         onboarded_at, view_preference, theme_preference, default_share_expires_in,
         confirm_delete, onboarding_step, custom_hotkeys, last_folder_id
       )
       SELECT
         $1, name, email, email_verified, image, created_at, updated_at,
         onboarded_at, view_preference, theme_preference, default_share_expires_in,
         confirm_delete, onboarding_step, custom_hotkeys, last_folder_id
       FROM "user"
       WHERE id = $2
       ON CONFLICT (id) DO NOTHING`,
      [newId, oldId],
    )

    const ownershipTables: Array<{ table: string; column: string }> = [
      { table: 'folders', column: 'user_id' },
      { table: 'files', column: 'user_id' },
      { table: 'share_links', column: 'created_by' },
      { table: 'session', column: 'user_id' },
      { table: 'account', column: 'user_id' },
      { table: 'favorites', column: 'user_id' },
      { table: 'tags', column: 'user_id' },
      { table: 'smart_folders', column: 'user_id' },
      { table: 'file_comments', column: 'user_id' },
      { table: 'activity_events', column: 'user_id' },
      { table: 'saved_searches', column: 'user_id' },
    ]

    for (const { table, column } of ownershipTables) {
      await client.query(
        `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
        [newId, oldId],
      )
    }

    await client.query(`DELETE FROM "user" WHERE id = $1`, [oldId])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
