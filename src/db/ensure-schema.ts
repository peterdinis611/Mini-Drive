import type { Pool } from 'pg'

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [table],
  )
  return Boolean(result.rows[0]?.exists)
}

async function columnNames(pool: Pool, table: string): Promise<Set<string>> {
  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )
  return new Set(result.rows.map((row) => row.column_name))
}

async function addColumn(
  pool: Pool,
  table: string,
  cols: Set<string>,
  name: string,
  ddl: string,
) {
  if (cols.has(name)) return
  await pool.query(`ALTER TABLE "${table}" ADD COLUMN ${ddl}`)
  cols.add(name)
}

/** Lightweight additive migrations for local/single-node Postgres. */
export async function ensurePgSchema(pool: Pool): Promise<void> {
  if (!(await tableExists(pool, 'user'))) return

  const userCols = await columnNames(pool, 'user')
  await addColumn(
    pool,
    'user',
    userCols,
    'email_verified',
    `"email_verified" boolean NOT NULL DEFAULT false`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'theme_preference',
    `"theme_preference" text NOT NULL DEFAULT 'system'`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'default_share_expires_in',
    `"default_share_expires_in" integer NOT NULL DEFAULT 3600`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'confirm_delete',
    `"confirm_delete" boolean NOT NULL DEFAULT true`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'view_preference',
    `"view_preference" text NOT NULL DEFAULT 'list'`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'onboarding_step',
    `"onboarding_step" integer NOT NULL DEFAULT 1`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'onboarded_at',
    `"onboarded_at" timestamptz`,
  )
  await addColumn(pool, 'user', userCols, 'image', `"image" text`)
  await addColumn(
    pool,
    'user',
    userCols,
    'custom_hotkeys',
    `"custom_hotkeys" text`,
  )
  await addColumn(
    pool,
    'user',
    userCols,
    'last_folder_id',
    `"last_folder_id" text`,
  )

  if (await tableExists(pool, 'files')) {
    const fileCols = await columnNames(pool, 'files')
    await addColumn(
      pool,
      'files',
      fileCols,
      'content_hash',
      `"content_hash" text`,
    )
    await addColumn(
      pool,
      'files',
      fileCols,
      'content_text',
      `"content_text" text`,
    )
    await addColumn(pool, 'files', fileCols, 'note', `"note" text`)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS "files_contentHash_idx" ON "files" ("user_id", "content_hash")`,
    )
  }

  if (await tableExists(pool, 'folders')) {
    const folderCols = await columnNames(pool, 'folders')
    await addColumn(pool, 'folders', folderCols, 'color', `"color" text`)
    await addColumn(
      pool,
      'folders',
      folderCols,
      'priority',
      `"priority" integer NOT NULL DEFAULT 0`,
    )
  }

  if (await tableExists(pool, 'share_links')) {
    const shareCols = await columnNames(pool, 'share_links')
    await addColumn(
      pool,
      'share_links',
      shareCols,
      'password_hash',
      `"password_hash" text`,
    )
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "favorites" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "target_type" text NOT NULL,
      "target_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_target_uidx"
      ON "favorites" ("user_id", "target_type", "target_id");
    CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites" ("user_id");

    CREATE TABLE IF NOT EXISTS "tags" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "color" text NOT NULL DEFAULT '#2f6fed',
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "tags_user_name_uidx" ON "tags" ("user_id", "name");
    CREATE INDEX IF NOT EXISTS "tags_userId_idx" ON "tags" ("user_id");

    CREATE TABLE IF NOT EXISTS "file_tags" (
      "file_id" text NOT NULL REFERENCES "files"("id") ON DELETE cascade,
      "tag_id" text NOT NULL REFERENCES "tags"("id") ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "file_tags_uidx" ON "file_tags" ("file_id", "tag_id");
    CREATE INDEX IF NOT EXISTS "file_tags_tagId_idx" ON "file_tags" ("tag_id");

    CREATE TABLE IF NOT EXISTS "folder_tags" (
      "folder_id" text NOT NULL REFERENCES "folders"("id") ON DELETE cascade,
      "tag_id" text NOT NULL REFERENCES "tags"("id") ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "folder_tags_uidx" ON "folder_tags" ("folder_id", "tag_id");
    CREATE INDEX IF NOT EXISTS "folder_tags_tagId_idx" ON "folder_tags" ("tag_id");

    CREATE TABLE IF NOT EXISTS "smart_folders" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "rules_json" text NOT NULL DEFAULT '{}',
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "smart_folders_userId_idx" ON "smart_folders" ("user_id");

    CREATE TABLE IF NOT EXISTS "file_comments" (
      "id" text PRIMARY KEY NOT NULL,
      "file_id" text NOT NULL REFERENCES "files"("id") ON DELETE cascade,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "body" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "file_comments_fileId_idx" ON "file_comments" ("file_id");
    CREATE INDEX IF NOT EXISTS "file_comments_userId_idx" ON "file_comments" ("user_id");

    CREATE TABLE IF NOT EXISTS "activity_events" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "action" text NOT NULL,
      "target_type" text NOT NULL,
      "target_id" text,
      "summary" text NOT NULL,
      "meta_json" text,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "activity_events_userId_idx" ON "activity_events" ("user_id");
    CREATE INDEX IF NOT EXISTS "activity_events_createdAt_idx" ON "activity_events" ("created_at");

    CREATE TABLE IF NOT EXISTS "saved_searches" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "query" text NOT NULL,
      "kind" text,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "saved_searches_userId_idx" ON "saved_searches" ("user_id");
  `)
}
