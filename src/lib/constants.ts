export const APP_NAME = 'Mini Drive'

/** Hard per-user storage ceiling (enforced on upload / replace). */
export const STORAGE_QUOTA_BYTES = 100 * 1024 ** 3

/** Soft-deleted items older than this are eligible for permanent purge. */
export const TRASH_RETENTION_DAYS = 30

export const UPLOAD_LIMITS = {
  maxFileSize: '32MB',
  maxFileSizeBytes: 32 * 1024 * 1024,
  maxFileCount: 10,
  allowedTypes: [
    'image',
    'video',
    'audio',
    'pdf',
    'text',
    'blob',
  ] as const,
} as const

export const AUTH_LIMITS = {
  /** Enforced on register / password change (Better Auth + Zod). */
  passwordMin: 12,
  passwordMax: 128,
  nameMax: 100,
} as const

export const SHARE_EXPIRY_PRESETS = [
  { label: '15 minút', value: 15 * 60 },
  { label: '1 hodina', value: 60 * 60 },
  { label: '24 hodín', value: 24 * 60 * 60 },
  { label: '7 dní', value: 7 * 24 * 60 * 60 },
] as const

/** Short-lived UploadThing signed URL issued on each public share hit. */
export const SHARE_SIGNED_URL_TTL_SECONDS = 5 * 60

/** Public /s/$token rate limit (per IP, sliding window). */
export const SHARE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
} as const

/** Authenticated createShare rate limit (per user, sliding window). */
export const CREATE_SHARE_RATE_LIMIT = {
  limit: 10,
  windowMs: 60_000,
} as const

/** Public password unlock attempts (per IP + token, sliding window). */
export const SHARE_PASSWORD_RATE_LIMIT = {
  limit: 10,
  windowMs: 60_000,
} as const

/** Max stored audit rows returned per share in the UI. */
export const SHARE_ACCESS_LOG_LIMIT = 50

export const NAME_MAX_LENGTH = 255
// Control chars (U+0000–U+001F) are rejected in folder/file names
export const FORBIDDEN_NAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/ // eslint-disable-line no-control-regex

export const ONBOARDING_STEPS = 4
