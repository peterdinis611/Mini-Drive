import { z } from 'zod'

import {
  AUTH_LIMITS,
  FORBIDDEN_NAME_CHARS,
  NAME_MAX_LENGTH,
  ONBOARDING_STEPS,
  SHARE_EXPIRY_PRESETS,
  UPLOAD_LIMITS,
} from './constants'
import { formatZodError } from './errors'

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

export const updateSettingsSchema = z
  .object({
    name: displayNameSchema.optional(),
    viewPreference: viewPreferenceSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.viewPreference !== undefined, {
    message: 'Nie je čo uložiť',
  })

export const expiresInSchema = z
  .number()
  .int()
  .positive()
  .refine(
    (value) => SHARE_EXPIRY_PRESETS.some((preset) => preset.value === value),
    { message: 'Neplatná platnosť odkazu' },
  )

export const createShareLinkSchema = z.object({
  fileId: z.string().uuid('Neplatné ID súboru'),
  expiresIn: expiresInSchema,
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

export const idSchema = z.string().uuid('Neplatné ID')

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
  fileIds: z
    .array(idSchema)
    .min(1, 'Vyber aspoň jeden súbor')
    .max(50, 'Príliš veľa súborov naraz'),
})

export const bulkMoveFilesSchema = z.object({
  fileIds: z.array(idSchema).min(1).max(50),
  folderId: idSchema.nullable(),
})

export const bulkShareFilesSchema = z.object({
  fileIds: z.array(idSchema).min(1).max(20),
  expiresIn: expiresInSchema,
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

export const imagePreviewUrlsSchema = z.object({
  fileIds: z.array(idSchema).max(24, 'Príliš veľa súborov naraz'),
})

export const listFolderContentsSchema = z.object({
  folderId: idSchema.nullable(),
})

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
    link.expiresAt instanceof Date
      ? link.expiresAt.getTime()
      : link.expiresAt
  return expiresAt > Date.now()
}
