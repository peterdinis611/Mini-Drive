/**
 * Production env guards. Call once at process boot (server entry / DB init).
 * Dev stays permissive so local setup can grow gradually.
 */

import { stderrLine } from '#/lib/logger'

const PROD_REQUIRED = [
  'APP_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'UPLOADTHING_TOKEN',
  'DATABASE_URL',
  'AUDIT_IP_PEPPER',
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
  if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
    throw new Error(
      '[mini-drive] DATABASE_URL must be a postgresql:// connection string in production.',
    )
  }
}

/** Soft warnings for optional but recommended production secrets. */
export function warnOptionalProductionEnv(): void {
  if (!isProduction()) return

  if (!process.env.BACKUP_ENCRYPTION_KEY?.trim()) {
    stderrLine(
      '[mini-drive] BACKUP_ENCRYPTION_KEY unset — `pnpm db:backup` will fail until set.',
    )
  }

  if (!process.env.REDIS_URL?.trim()) {
    stderrLine(
      '[mini-drive] REDIS_URL unset — rate limits are in-memory (not shared across instances).',
    )
  }

  if (!process.env.SHARE_PASSWORD_PEPPER?.trim()) {
    stderrLine(
      '[mini-drive] SHARE_PASSWORD_PEPPER unset — falling back to AUDIT_IP_PEPPER for share passwords.',
    )
  }

  const clerkPub = process.env.CLERK_PUBLISHABLE_KEY ?? ''
  if (clerkPub.startsWith('pk_test_')) {
    stderrLine(
      '[mini-drive] CLERK_PUBLISHABLE_KEY looks like a test key in production.',
    )
  }

  if (process.env.VIRUS_SCAN_REQUIRE_CLAMAV !== '1') {
    stderrLine(
      '[mini-drive] VIRUS_SCAN_REQUIRE_CLAMAV is not 1 — share scans may fail open without ClamAV.',
    )
  }

  const pepper = process.env.AUDIT_IP_PEPPER?.trim() ?? ''
  if (pepper.length > 0 && pepper.length < 32) {
    stderrLine(
      '[mini-drive] AUDIT_IP_PEPPER is short — use at least 32 random bytes (openssl rand -hex 32).',
    )
  }
}
