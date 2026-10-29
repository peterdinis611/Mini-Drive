/**
 * Production env guards. Call once at process boot (server entry / DB init).
 * Dev stays permissive so local setup can grow gradually.
 */

const PROD_REQUIRED = [
  'APP_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'UPLOADTHING_TOKEN',
  'DATABASE_URL',
] as const

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function missing(keys: readonly string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key]
    return value == null || value.trim() === ''
  })
}

/** Throws in production when critical secrets / URLs are unset. */
export function assertProductionEnv(): void {
  if (!isProduction()) return
  // `vite build` may evaluate server modules without runtime secrets.
  if (process.env.npm_lifecycle_event === 'build') return

  const absent = missing(PROD_REQUIRED)
  if (absent.length > 0) {
    throw new Error(
      `[mini-drive] Production requires: ${absent.join(', ')}. See .env.example.`,
    )
  }

  const appUrl = process.env.APP_URL!.replace(/\/$/, '')
  if (!/^https:\/\//i.test(appUrl)) {
    throw new Error(
      `[mini-drive] APP_URL must be https in production (got ${appUrl}).`,
    )
  }

  if (/localhost|127\.0\.0\.1/i.test(appUrl)) {
    throw new Error(
      '[mini-drive] APP_URL must not point at localhost in production.',
    )
  }

  const dbUrl = process.env.DATABASE_URL!.trim()
  if (dbUrl === 'dev.db' || dbUrl.endsWith('/dev.db')) {
    throw new Error(
      '[mini-drive] DATABASE_URL must not use the local `dev.db` path in production.',
    )
  }
}

/** Soft warnings for optional but recommended production secrets. */
export function warnOptionalProductionEnv(): void {
  if (!isProduction()) return

  if (!process.env.AUDIT_IP_PEPPER?.trim()) {
    console.warn(
      '[mini-drive] AUDIT_IP_PEPPER unset — share IP hashes fall back to CLERK_SECRET_KEY.',
    )
  }

  if (!process.env.BACKUP_ENCRYPTION_KEY?.trim()) {
    console.warn(
      '[mini-drive] BACKUP_ENCRYPTION_KEY unset — `pnpm db:backup` will fail until set.',
    )
  }
}
