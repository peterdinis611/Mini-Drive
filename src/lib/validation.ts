import { z } from 'zod'

import {
  AUTH_LIMITS,
  FORBIDDEN_NAME_CHARS,
  NAME_MAX_LENGTH,
  ONBOARDING_STEPS,
  SHARE_EXPIRY_PRESETS,
  UPLOAD_LIMITS,
} from './constants'
import { AppError, formatZodError } from './errors'

/** Typed confirm word for wipe-all (UI + server must match). */
export const DELETE_ALL_CONFIRM_WORD = 'ZMAZAŤ'

/** Typed confirm word for emptying trash. */
export const EMPTY_TRASH_CONFIRM_WORD = 'VYPRÁZDNIŤ'

const RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'lpt1',
  'lpt2',
  'lpt3',
])

export const viewPreferenceSchema = z.enum(['grid', 'list'])

export const themePreferenceSchema = z.enum(['light', 'dark', 'system'])

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Meno je povinné')
  .max(AUTH_LIMITS.nameMax, `Max. ${AUTH_LIMITS.nameMax} znakov`)

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email je povinný')
  .email('Neplatný email')
  .max(254, 'Email je príliš dlhý')

/** Registration / password change — strong minimum. */
export const passwordSchema = z
  .string()
  .min(
    AUTH_LIMITS.passwordMin,
    `Heslo musí mať aspoň ${AUTH_LIMITS.passwordMin} znakov`,
  )
  .max(
    AUTH_LIMITS.passwordMax,
    `Heslo môže mať najviac ${AUTH_LIMITS.passwordMax} znakov`,
  )

/**
 * Login only — do not enforce new min length so existing accounts can still sign in.
 * Server still verifies the hash; client just needs a non-empty secret.
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Heslo je povinné')
  .max(
    AUTH_LIMITS.passwordMax,
    `Heslo môže mať najviac ${AUTH_LIMITS.passwordMax} znakov`,
  )

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
})

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(AUTH_LIMITS.nameMax, `Max. ${AUTH_LIMITS.nameMax} znakov`)
    .default(''),
  email: emailSchema,
  password: passwordSchema,
})

export const fileNameSchema = z
  .string()
  .trim()
  .min(1, 'Názov je povinný')
  .max(NAME_MAX_LENGTH, `Max. ${NAME_MAX_LENGTH} znakov`)
  .refine((name) => !FORBIDDEN_NAME_CHARS.test(name), {
    message: 'Názov obsahuje zakázané znaky (<>:"/\\|?*)',
  })
  .refine((name) => name !== '.' && name !== '..', {
    message: 'Neplatný názov',
  })
  .refine((name) => !name.endsWith('.') && !name.endsWith(' '), {
    message: 'Názov nesmie končiť bodkou ani medzerou',
  })
  .refine((name) => !RESERVED_NAMES.has(name.toLowerCase()), {
    message: 'Tento názov je rezervovaný',
  })

export const folderNameSchema = fileNameSchema

export const onboardingStepSchema = z
  .number()
  .int()
  .min(1)
  .max(ONBOARDING_STEPS)

export const onboardingPreferencesSchema = z.object({
  name: displayNameSchema,
  viewPreference: viewPreferenceSchema,
})

export const expiresInSchema = z
  .number()
  .int()
  .positive()
  .refine(
    (value) => SHARE_EXPIRY_PRESETS.some((preset) => preset.value === value),
    { message: 'Neplatná platnosť odkazu' },
  )

export const updateSettingsSchema = z
  .object({
    name: displayNameSchema.optional(),
    viewPreference: viewPreferenceSchema.optional(),
    themePreference: themePreferenceSchema.optional(),
    defaultShareExpiresIn: expiresInSchema.optional(),
    confirmDelete: z.boolean().optional(),
    customHotkeys: z.string().max(20_000).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.viewPreference !== undefined ||
      data.themePreference !== undefined ||
      data.defaultShareExpiresIn !== undefined ||
      data.confirmDelete !== undefined ||
      data.customHotkeys !== undefined,
    { message: 'Nie je čo uložiť' },
  )

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Heslá sa nezhodujú',
    path: ['confirmPassword'],
  })

/** Share-link password (required — not account password rules). */
export const shareLinkPasswordSchema = z
  .string()
  .min(6, 'Heslo musí mať aspoň 6 znakov')
  .max(128, 'Heslo môže mať najviac 128 znakov')

export const createShareLinkSchema = z.object({
  fileId: z.string().uuid('Neplatné ID súboru'),
  expiresIn: expiresInSchema,
  /** Required — public open always needs a password. */
  password: shareLinkPasswordSchema,
})

export const revokeShareLinkSchema = z.object({
  shareId: z.string().uuid('Neplatné ID odkazu'),
})

export const listShareAccessLogsSchema = z.object({
  shareId: z.string().uuid('Neplatné ID odkazu'),
})

export const shareTokenSchema = z
  .string()
  .trim()
  .min(16, 'Neplatný token')
  .max(128, 'Neplatný token')
  .regex(/^[A-Za-z0-9_-]+$/, 'Neplatný token')

export const resolveShareTokenSchema = z.object({
  token: shareTokenSchema,
})

export const unlockPublicShareSchema = z.object({
  token: shareTokenSchema,
  password: z
    .string()
    .min(1, 'Zadaj heslo')
    .max(128, 'Heslo môže mať najviac 128 znakov'),
})

export const idSchema = z.string().uuid('Neplatné ID')

/** Non-empty UUID list without duplicates. */
export function uniqueIdArraySchema(
  min: number,
  max: number,
  messages?: { min?: string; max?: string },
) {
  return z
    .array(idSchema)
    .min(min, messages?.min ?? 'Vyber aspoň jednu položku')
    .max(max, messages?.max ?? 'Príliš veľa položiek naraz')
    .superRefine((ids, ctx) => {
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Zoznam obsahuje duplicitné ID',
        })
      }
    })
}

export const createFolderSchema = z.object({
  name: folderNameSchema,
  parentId: idSchema.nullable(),
})

export const renameFolderSchema = z.object({
  folderId: idSchema,
  name: folderNameSchema,
})

export const deleteFolderSchema = z.object({
  folderId: idSchema,
})

export const moveFolderSchema = z.object({
  folderId: idSchema,
  newParentId: idSchema.nullable(),
})

export const renameFileSchema = z.object({
  fileId: idSchema,
  name: fileNameSchema,
})

export const moveFileSchema = z.object({
  fileId: idSchema,
  folderId: idSchema.nullable(),
})

export const deleteFileSchema = z.object({
  fileId: idSchema,
})

export const fileIdsSchema = z.object({
  fileIds: uniqueIdArraySchema(1, 50, {
    min: 'Vyber aspoň jeden súbor',
    max: 'Príliš veľa súborov naraz',
  }),
})

export const bulkMoveFilesSchema = z.object({
  fileIds: uniqueIdArraySchema(1, 50, {
    min: 'Vyber aspoň jeden súbor',
    max: 'Príliš veľa súborov naraz',
  }),
  folderId: idSchema.nullable(),
})

export const bulkShareFilesSchema = z.object({
  fileIds: uniqueIdArraySchema(1, 20, {
    min: 'Vyber aspoň jeden súbor',
    max: 'Naraz môžeš zdieľať najviac 20 súborov',
  }),
  expiresIn: expiresInSchema,
  password: shareLinkPasswordSchema,
})

export const restoreFileSchema = z.object({
  fileId: idSchema,
})

export const restoreFolderSchema = z.object({
  folderId: idSchema,
})

export const purgeFileSchema = z.object({
  fileId: idSchema,
})

export const purgeFolderSchema = z.object({
  folderId: idSchema,
})

export const listFileVersionsSchema = z.object({
  fileId: idSchema,
})

export const restoreFileVersionSchema = z.object({
  fileId: idSchema,
  versionId: idSchema,
})

export const favoriteTargetSchema = z.object({
  targetType: z.enum(['file', 'folder']),
  targetId: idSchema,
})

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, 'Názov tagu je povinný')
  .max(40, 'Max. 40 znakov')

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Neplatná farba')
    .optional(),
})

export const deleteTagSchema = z.object({
  tagId: idSchema,
})

export const setFileTagsSchema = z.object({
  fileId: idSchema,
  tagIds: uniqueIdArraySchema(0, 20, {
    max: 'Najviac 20 tagov na súbor',
  }),
})

export const setFolderTagsSchema = z.object({
  folderId: idSchema,
  tagIds: uniqueIdArraySchema(0, 20, {
    max: 'Najviac 20 tagov na priečinok',
  }),
})

export const smartFolderRulesSchema = z.object({
  query: z.string().trim().max(200).optional(),
  kind: z.enum(['all', 'image', 'pdf', 'video', 'audio', 'text']).optional(),
  tagId: idSchema.optional(),
  duplicatesOnly: z.boolean().optional(),
})

export const createSmartFolderSchema = z.object({
  name: folderNameSchema,
  rules: smartFolderRulesSchema,
})

export const deleteSmartFolderSchema = z.object({
  smartFolderId: idSchema,
})

export const zipFolderSchema = z.object({
  folderId: idSchema,
})

export const bulkDownloadUrlsSchema = z.object({
  fileIds: uniqueIdArraySchema(1, 50, {
    min: 'Vyber aspoň jeden súbor',
    max: 'Naraz najviac 50 súborov',
  }),
})

export const saveCustomHotkeysSchema = z.object({
  customHotkeys: z.string().max(20_000),
})

export const bulkRenamePatternSchema = z.object({
  fileIds: uniqueIdArraySchema(1, 50, {
    min: 'Vyber aspoň jeden súbor',
    max: 'Naraz najviac 50 súborov',
  }),
  /** Pattern with `{n}` (1-based index) and optional `{name}` / `{ext}`. */
  pattern: z
    .string()
    .trim()
    .min(1, 'Vzor je povinný')
    .max(180, 'Vzor je príliš dlhý')
    .refine((value) => value.includes('{n}') || value.includes('{name}'), {
      message: 'Vzor musí obsahovať {n} alebo {name}',
    }),
  startAt: z.number().int().min(0).max(9999).optional().default(1),
})

export const checkUploadConflictsSchema = z.object({
  folderId: idSchema.nullable(),
  names: z
    .array(fileNameSchema)
    .min(1, 'Aspoň jeden názov')
    .max(UPLOAD_LIMITS.maxFileCount),
})

export const setLastFolderSchema = z.object({
  folderId: idSchema.nullable(),
})

export const updateFolderStyleSchema = z.object({
  folderId: idSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Neplatná farba')
    .nullable()
    .optional(),
  priority: z.number().int().min(0).max(3).optional(),
})

export const updateFileNoteSchema = z.object({
  fileId: idSchema,
  /** HTML from TipTap (or plain text for legacy notes). */
  note: z.string().trim().max(20_000).nullable(),
})

export const addFileCommentSchema = z.object({
  fileId: idSchema,
  body: z.string().trim().min(1, 'Komentár je prázdny').max(2_000),
})

export const deleteFileCommentSchema = z.object({
  commentId: idSchema,
})

export const listFileCommentsSchema = z.object({
  fileId: idSchema,
})

export const createSavedSearchSchema = z.object({
  name: z.string().trim().min(1).max(80),
  query: z.string().trim().min(1).max(200),
  kind: z
    .enum(['all', 'image', 'pdf', 'video', 'audio', 'text'])
    .optional()
    .nullable(),
})

export const deleteSavedSearchSchema = z.object({
  searchId: idSchema,
})

export const createEmbedShareSchema = z.object({
  fileId: idSchema,
  expiresIn: expiresInSchema,
})

export const imagePreviewUrlsSchema = z.object({
  fileIds: uniqueIdArraySchema(0, 24, {
    max: 'Príliš veľa súborov naraz',
  }),
})

export const listFolderContentsSchema = z.object({
  folderId: idSchema.nullable(),
})

/** Soft-delete entire drive — must type the confirm word. */
export const deleteAllDriveSchema = z.object({
  confirm: z
    .string()
    .trim()
    .min(1, 'Potvrdenie je povinné')
    .transform((value) => value.toLocaleUpperCase('sk-SK'))
    .refine((value) => value === DELETE_ALL_CONFIRM_WORD, {
      message: `Na potvrdenie napíš ${DELETE_ALL_CONFIRM_WORD}`,
    }),
})

/** Permanently empty trash — must type the confirm word. */
export const emptyTrashSchema = z.object({
  confirm: z
    .string()
    .trim()
    .min(1, 'Potvrdenie je povinné')
    .transform((value) => value.toLocaleUpperCase('sk-SK'))
    .refine((value) => value === EMPTY_TRASH_CONFIRM_WORD, {
      message: `Na potvrdenie napíš ${EMPTY_TRASH_CONFIRM_WORD}`,
    }),
})

/** UploadThing middleware input — shared with server router. */
export const uploadInputSchema = z.object({
  folderId: idSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  replaceFileId: idSchema.optional().nullable(),
  saveAsName: z
    .union([fileNameSchema, z.null()])
    .optional()
    .transform((value) => value ?? null),
})

/**
 * Parse unknown input with Zod; throw AppError with the first Slovak message.
 * Use inside server handlers / middleware when `.validator()` is not enough.
 */
export function parseServerInput<TSchema extends z.ZodType>(
  schema: TSchema,
  raw: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new AppError(formatZodError(result.error), 'VALIDATION')
  }
  return result.data
}

export type UploadValidationResult =
  | { ok: true; files: File[] }
  | { ok: false; message: string }

/** Client-side upload gate before calling UploadThing. */
export function validateFilesForUpload(
  incoming: File[] | FileList | null | undefined,
): UploadValidationResult {
  if (!incoming) {
    return { ok: false, message: 'Nevybral si žiadny súbor' }
  }

  const list = Array.from(incoming)
  if (list.length === 0) {
    return { ok: false, message: 'Nevybral si žiadny súbor' }
  }

  const truncated = list.length > UPLOAD_LIMITS.maxFileCount
  const files = list.slice(0, UPLOAD_LIMITS.maxFileCount)

  for (const file of files) {
    if (!file.name.trim()) {
      return { ok: false, message: 'Súbor nemá platný názov' }
    }

    const nameResult = fileNameSchema.safeParse(file.name)
    if (!nameResult.success) {
      return {
        ok: false,
        message: `„${file.name}“: ${formatZodError(nameResult.error)}`,
      }
    }

    if (file.size <= 0) {
      return {
        ok: false,
        message: `Súbor „${file.name}“ je prázdny`,
      }
    }

    if (file.size > UPLOAD_LIMITS.maxFileSizeBytes) {
      return {
        ok: false,
        message: `Súbor „${file.name}“ prekračuje limit ${UPLOAD_LIMITS.maxFileSize}`,
      }
    }
  }

  if (truncated) {
    return {
      ok: true,
      files,
    }
  }

  return { ok: true, files }
}

export function wouldCreateFolderCycle(
  folderId: string,
  newParentId: string | null,
  parentById: Map<string, string | null>,
): boolean {
  if (newParentId === null) return false
  if (newParentId === folderId) return true

  let current: string | null = newParentId
  const visited = new Set<string>()

  while (current) {
    if (current === folderId) return true
    if (visited.has(current)) return true
    visited.add(current)
    current = parentById.get(current) ?? null
  }

  return false
}

export function isShareLinkActive(link: {
  expiresAt: Date | number
  revokedAt: Date | number | null
}): boolean {
  if (link.revokedAt != null) return false
  const expiresAt =
    link.expiresAt instanceof Date ? link.expiresAt.getTime() : link.expiresAt
  return expiresAt > Date.now()
}
