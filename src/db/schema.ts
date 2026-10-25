import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
  onboardedAt: integer('onboarded_at', { mode: 'timestamp_ms' }),
  viewPreference: text('view_preference', { enum: ['grid', 'list'] })
    .notNull()
    .default('list'),
  themePreference: text('theme_preference', {
    enum: ['light', 'dark', 'system'],
  })
    .notNull()
    .default('system'),
  /** Default share link TTL (seconds) — must match SHARE_EXPIRY_PRESETS. */
  defaultShareExpiresIn: integer('default_share_expires_in')
    .notNull()
    .default(3600),
  confirmDelete: integer('confirm_delete', { mode: 'boolean' })
    .notNull()
    .default(true),
  onboardingStep: integer('onboarding_step').notNull().default(1),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const folders = sqliteTable(
  'folders',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('folders_user_parent_name_uidx')
      .on(table.userId, table.parentId, table.name)
      .where(sql`${table.deletedAt} is null`),
    index('folders_userId_idx').on(table.userId),
    index('folders_deletedAt_idx').on(table.deletedAt),
  ],
)

export const files = sqliteTable(
  'files',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    folderId: text('folder_id').references(() => folders.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadthingKey: text('uploadthing_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    currentVersion: integer('current_version').notNull().default(1),
  },
  (table) => [
    index('files_userId_idx').on(table.userId),
    index('files_folderId_idx').on(table.folderId),
    index('files_deletedAt_idx').on(table.deletedAt),
  ],
)

/** Archived prior revisions of a file (current blob stays on `files`). */
export const fileVersions = sqliteTable(
  'file_versions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    name: text('name').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadthingKey: text('uploadthing_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [
    uniqueIndex('file_versions_file_version_uidx').on(
      table.fileId,
      table.version,
    ),
    index('file_versions_fileId_idx').on(table.fileId),
  ],
)

export const shareLinks = sqliteTable(
  'share_links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [
    index('share_links_fileId_idx').on(table.fileId),
    index('share_links_token_idx').on(table.token),
  ],
)

/** Audit log of successful public share opens (HMAC IP fingerprint + UA truncated). */
export const shareAccessLogs = sqliteTable(
  'share_access_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shareLinkId: text('share_link_id')
      .notNull()
      .references(() => shareLinks.id, { onDelete: 'cascade' }),
    accessedAt: integer('accessed_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    /** HMAC-SHA256 fingerprint — never store raw IP. */
    ipAddress: text('ip_address').notNull(),
    userAgent: text('user_agent'),
  },
  (table) => [
    index('share_access_logs_shareLinkId_idx').on(table.shareLinkId),
    index('share_access_logs_accessedAt_idx').on(table.accessedAt),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  folders: many(folders),
  files: many(files),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: 'folder_parent',
  }),
  children: many(folders, { relationName: 'folder_parent' }),
  files: many(files),
}))

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(user, {
    fields: [files.userId],
    references: [user.id],
  }),
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
  shareLinks: many(shareLinks),
  versions: many(fileVersions),
}))

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(files, {
    fields: [fileVersions.fileId],
    references: [files.id],
  }),
}))

export const shareLinksRelations = relations(shareLinks, ({ one, many }) => ({
  file: one(files, {
    fields: [shareLinks.fileId],
    references: [files.id],
  }),
  creator: one(user, {
    fields: [shareLinks.createdBy],
    references: [user.id],
  }),
  accessLogs: many(shareAccessLogs),
}))

export const shareAccessLogsRelations = relations(
  shareAccessLogs,
  ({ one }) => ({
    shareLink: one(shareLinks, {
      fields: [shareAccessLogs.shareLinkId],
      references: [shareLinks.id],
    }),
  }),
)

export type User = typeof user.$inferSelect
export type Folder = typeof folders.$inferSelect
export type FileRecord = typeof files.$inferSelect
export type FileVersion = typeof fileVersions.$inferSelect
export type ShareLink = typeof shareLinks.$inferSelect
export type ShareAccessLog = typeof shareAccessLogs.$inferSelect
