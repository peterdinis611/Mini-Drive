import { STORAGE_QUOTA_BYTES } from '#/lib/constants'

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function projectStorageUsage(args: {
  usedBytes: number
  additionalBytes: number
  releasingBytes?: number
}): number {
  const releasing = args.releasingBytes ?? 0
  return args.usedBytes - releasing + args.additionalBytes
}

export function remainingStorageBytes(args: {
  usedBytes: number
  releasingBytes?: number
  quotaBytes?: number
}): number {
  const quota = args.quotaBytes ?? STORAGE_QUOTA_BYTES
  const releasing = args.releasingBytes ?? 0
  return Math.max(0, quota - (args.usedBytes - releasing))
}

export type QuotaCheckResult =
  | { ok: true }
  | { ok: false; remainingBytes: number; message: string }

/** Pure quota gate used by upload / replace paths. */
export function checkStorageQuota(args: {
  usedBytes: number
  additionalBytes: number
  releasingBytes?: number
  quotaBytes?: number
}): QuotaCheckResult {
  const quota = args.quotaBytes ?? STORAGE_QUOTA_BYTES
  const projected = projectStorageUsage(args)

  if (projected <= quota) {
    return { ok: true }
  }

  const remainingBytes = remainingStorageBytes({
    usedBytes: args.usedBytes,
    releasingBytes: args.releasingBytes,
    quotaBytes: quota,
  })

  return {
    ok: false,
    remainingBytes,
    message: `Nedostatok miesta v úložisku (zostáva ${formatStorageBytes(remainingBytes)}).`,
  }
}
