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

  addUserColumn('email_verified', `"email_verified" integer NOT NULL DEFAULT 0`)
  addUserColumn(
    'theme_preference',
    `"theme_preference" text NOT NULL DEFAULT 'system'`,
  )
  addUserColumn(
    'default_share_expires_in',
    `"default_share_expires_in" integer NOT NULL DEFAULT 3600`,
  )
  addUserColumn('confirm_delete', `"confirm_delete" integer NOT NULL DEFAULT 1`)
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
  addUserColumn('custom_hotkeys', `"custom_hotkeys" text`)
  addUserColumn('last_folder_id', `"last_folder_id" text`)

  const fileCols = new Set(
    (
      sqlite.prepare(`PRAGMA table_info("files")`).all() as Array<{
        name: string
      }>
    ).map((row) => row.name),
  )

  if (fileCols.size > 0) {
    if (!fileCols.has('content_hash')) {
      sqlite.exec(`ALTER TABLE "files" ADD COLUMN "content_hash" text`)
    }
    if (!fileCols.has('content_text')) {
      sqlite.exec(`ALTER TABLE "files" ADD COLUMN "content_text" text`)
    }
    if (!fileCols.has('note')) {
      sqlite.exec(`ALTER TABLE "files" ADD COLUMN "note" text`)
    }
    sqlite.exec(
      `CREATE INDEX IF NOT EXISTS "files_contentHash_idx" ON "files" ("user_id", "content_hash")`,
    )
  }

  const folderCols = new Set(
    (
      sqlite.prepare(`PRAGMA table_info("folders")`).all() as Array<{
        name: string
      }>
    ).map((row) => row.name),
  )

  if (folderCols.size > 0) {
    if (!folderCols.has('color')) {
      sqlite.exec(`ALTER TABLE "folders" ADD COLUMN "color" text`)
    }
    if (!folderCols.has('priority')) {
      sqlite.exec(
        `ALTER TABLE "folders" ADD COLUMN "priority" integer NOT NULL DEFAULT 0`,
      )
    }
  }

  const shareCols = new Set(
    (
      sqlite.prepare(`PRAGMA table_info("share_links")`).all() as Array<{
        name: string
      }>
    ).map((row) => row.name),
  )
  if (shareCols.size > 0 && !shareCols.has('password_hash')) {
    sqlite.exec(`ALTER TABLE "share_links" ADD COLUMN "password_hash" text`)
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "favorites" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "target_type" text NOT NULL,
      "target_id" text NOT NULL,
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_target_uidx"
      ON "favorites" ("user_id", "target_type", "target_id");
    CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites" ("user_id");

    CREATE TABLE IF NOT EXISTS "tags" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "color" text NOT NULL DEFAULT '#2f6fed',
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
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
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
    );
    CREATE INDEX IF NOT EXISTS "smart_folders_userId_idx" ON "smart_folders" ("user_id");

    CREATE TABLE IF NOT EXISTS "file_comments" (
      "id" text PRIMARY KEY NOT NULL,
      "file_id" text NOT NULL REFERENCES "files"("id") ON DELETE cascade,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "body" text NOT NULL,
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
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
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
    );
    CREATE INDEX IF NOT EXISTS "activity_events_userId_idx" ON "activity_events" ("user_id");
    CREATE INDEX IF NOT EXISTS "activity_events_createdAt_idx" ON "activity_events" ("created_at");

    CREATE TABLE IF NOT EXISTS "saved_searches" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "query" text NOT NULL,
      "kind" text,
      "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
    );
    CREATE INDEX IF NOT EXISTS "saved_searches_userId_idx" ON "saved_searches" ("user_id");
  `)
}
