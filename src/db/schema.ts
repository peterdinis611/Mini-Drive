import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const ts = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'date' })

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  onboardedAt: ts('onboarded_at'),
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
  confirmDelete: boolean('confirm_delete').notNull().default(true),
  onboardingStep: integer('onboarding_step').notNull().default(1),
  /** JSON map of TanStack Hotkeys custom bindings. */
  customHotkeys: text('custom_hotkeys'),
  /** Last opened folder — resume browsing. */
  lastFolderId: text('last_folder_id'),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: ts('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
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
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const folders = pgTable(
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
    /** Accent color for sidebar / tree (hex). */
    color: text('color'),
    /** 0 = normal, 1–3 = higher priority pin order. */
    priority: integer('priority').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at'),
  },
  (table) => [
    uniqueIndex('folders_user_parent_name_uidx')
      .on(table.userId, table.parentId, table.name)
      .where(sql`${table.deletedAt} is null`),
    index('folders_userId_idx').on(table.userId),
    index('folders_deletedAt_idx').on(table.deletedAt),
  ],
)

export const files = pgTable(
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
    createdAt: ts('created_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at'),
    currentVersion: integer('current_version').notNull().default(1),
    /** SHA-256 of file bytes — duplicate detection. */
    contentHash: text('content_hash'),
    /** Extracted plain text for full-text / Fuse search (truncated). */
    contentText: text('content_text'),
    /** Free-form note attached to the file. */
    note: text('note'),
  },
  (table) => [
    index('files_userId_idx').on(table.userId),
    index('files_folderId_idx').on(table.folderId),
    index('files_deletedAt_idx').on(table.deletedAt),
    index('files_contentHash_idx').on(table.userId, table.contentHash),
  ],
)

/** Comments / discussion on a file. */
export const fileComments = pgTable(
  'file_comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('file_comments_fileId_idx').on(table.fileId),
    index('file_comments_userId_idx').on(table.userId),
  ],
)

/** Single-user (and future multi-user) audit trail. */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    targetType: text('target_type', {
      enum: ['file', 'folder', 'share', 'system'],
    }).notNull(),
    targetId: text('target_id'),
    summary: text('summary').notNull(),
    metaJson: text('meta_json'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('activity_events_userId_idx').on(table.userId),
    index('activity_events_createdAt_idx').on(table.createdAt),
  ],
)

/** Named saved searches (separate from smart folders). */
export const savedSearches = pgTable(
  'saved_searches',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    query: text('query').notNull(),
    kind: text('kind'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [index('saved_searches_userId_idx').on(table.userId)],
)

/** Pinned files / folders for quick access. */
export const favorites = pgTable(
  'favorites',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['file', 'folder'] }).notNull(),
    targetId: text('target_id').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('favorites_user_target_uidx').on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index('favorites_userId_idx').on(table.userId),
  ],
)

export const tags = pgTable(
  'tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#2f6fed'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tags_user_name_uidx').on(table.userId, table.name),
    index('tags_userId_idx').on(table.userId),
  ],
)

export const fileTags = pgTable(
  'file_tags',
  {
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('file_tags_uidx').on(table.fileId, table.tagId),
    index('file_tags_tagId_idx').on(table.tagId),
  ],
)

export const folderTags = pgTable(
  'folder_tags',
  {
    folderId: text('folder_id')
      .notNull()
      .references(() => folders.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('folder_tags_uidx').on(table.folderId, table.tagId),
    index('folder_tags_tagId_idx').on(table.tagId),
  ],
)

/** Saved smart-folder rules (JSON filter). */
export const smartFolders = pgTable(
  'smart_folders',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** JSON: { query?, kind?, tagId?, duplicatesOnly? } */
    rulesJson: text('rules_json').notNull().default('{}'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [index('smart_folders_userId_idx').on(table.userId)],
)

/** Archived prior revisions of a file (current blob stays on `files`). */
export const fileVersions = pgTable(
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
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('file_versions_file_version_uidx').on(
      table.fileId,
      table.version,
    ),
    index('file_versions_fileId_idx').on(table.fileId),
  ],
)

export const shareLinks = pgTable(
  'share_links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: ts('expires_at').notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    revokedAt: ts('revoked_at'),
    /** scrypt hash — never return plaintext; null = open link. */
    passwordHash: text('password_hash'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('share_links_fileId_idx').on(table.fileId),
    index('share_links_token_idx').on(table.token),
  ],
)

/** Audit log of successful public share opens (HMAC IP fingerprint + UA truncated). */
export const shareAccessLogs = pgTable(
  'share_access_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shareLinkId: text('share_link_id')
      .notNull()
      .references(() => shareLinks.id, { onDelete: 'cascade' }),
    accessedAt: ts('accessed_at').notNull().defaultNow(),
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
  favorites: many(favorites),
  tags: many(tags),
  smartFolders: many(smartFolders),
  activityEvents: many(activityEvents),
  savedSearches: many(savedSearches),
  fileComments: many(fileComments),
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
  fileTags: many(fileTags),
  comments: many(fileComments),
}))

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(user, {
    fields: [favorites.userId],
    references: [user.id],
  }),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
  fileTags: many(fileTags),
  folderTags: many(folderTags),
}))

export const fileTagsRelations = relations(fileTags, ({ one }) => ({
  file: one(files, {
    fields: [fileTags.fileId],
    references: [files.id],
  }),
  tag: one(tags, {
    fields: [fileTags.tagId],
    references: [tags.id],
  }),
}))

export const folderTagsRelations = relations(folderTags, ({ one }) => ({
  folder: one(folders, {
    fields: [folderTags.folderId],
    references: [folders.id],
  }),
  tag: one(tags, {
    fields: [folderTags.tagId],
    references: [tags.id],
  }),
}))

export const smartFoldersRelations = relations(smartFolders, ({ one }) => ({
  user: one(user, {
    fields: [smartFolders.userId],
    references: [user.id],
  }),
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
export type Favorite = typeof favorites.$inferSelect
export type Tag = typeof tags.$inferSelect
export type SmartFolder = typeof smartFolders.$inferSelect
export type FileComment = typeof fileComments.$inferSelect
export type ActivityEvent = typeof activityEvents.$inferSelect
export type SavedSearch = typeof savedSearches.$inferSelect
