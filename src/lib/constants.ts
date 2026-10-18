export const APP_NAME = 'Mini Drive'

export const UPLOAD_LIMITS = {
  maxFileSize: '32MB',
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

export const NAME_MAX_LENGTH = 255
// Control chars (U+0000–U+001F) are rejected in folder/file names
export const FORBIDDEN_NAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/ // eslint-disable-line no-control-regex

export const ONBOARDING_STEPS = 4
