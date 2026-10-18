import { z } from 'zod'

import {
  FORBIDDEN_NAME_CHARS,
  NAME_MAX_LENGTH,
  ONBOARDING_STEPS,
  SHARE_EXPIRY_PRESETS,
} from './constants'

export const viewPreferenceSchema = z.enum(['grid', 'list'])

export const fileNameSchema = z
  .string()
  .trim()
  .min(1, 'Názov je povinný')
  .max(NAME_MAX_LENGTH, `Max. ${NAME_MAX_LENGTH} znakov`)
  .refine((name) => !FORBIDDEN_NAME_CHARS.test(name), {
    message: 'Názov obsahuje zakázané znaky',
  })
  .refine((name) => name !== '.' && name !== '..', {
    message: 'Neplatný názov',
  })

export const folderNameSchema = fileNameSchema

export const onboardingStepSchema = z
  .number()
  .int()
  .min(1)
  .max(ONBOARDING_STEPS)

export const onboardingPreferencesSchema = z.object({
  name: z.string().trim().min(1, 'Meno je povinné').max(100),
  viewPreference: viewPreferenceSchema,
})

export const expiresInSchema = z
  .number()
  .int()
  .positive()
  .refine(
    (value) =>
      SHARE_EXPIRY_PRESETS.some((preset) => preset.value === value),
    { message: 'Neplatná platnosť odkazu' },
  )

export const createShareLinkSchema = z.object({
  fileId: z.string().uuid(),
  expiresIn: expiresInSchema,
})

export const revokeShareLinkSchema = z.object({
  shareId: z.string().uuid(),
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

export const idSchema = z.string().uuid()

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

export const listFolderContentsSchema = z.object({
  folderId: idSchema.nullable(),
})


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
