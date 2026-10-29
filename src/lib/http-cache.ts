/**
 * Production Cache-Control helpers for hashed Vite assets + public static files.
 * HTML / app routes stay short-lived so SSR/Clerk stay fresh.
 */

const IMMUTABLE_ASSET =
  /^\/assets\/[^/?#]+\.(js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|map)$/i

const LONG_LIVED_PUBLIC =
  /^\/(favicon\.svg|og\.svg|site\.webmanifest|marketing\/.+)$/i

const NEVER_CACHE = /^\/(api\/|s\/|e\/|_serverFn)/i

export function cacheControlForPath(pathname: string): string | null {
  if (process.env.NODE_ENV !== 'production') return null

  if (NEVER_CACHE.test(pathname)) {
    return 'private, no-store'
  }

  if (IMMUTABLE_ASSET.test(pathname)) {
    return 'public, max-age=31536000, immutable'
  }

  if (LONG_LIVED_PUBLIC.test(pathname)) {
    return 'public, max-age=86400, stale-while-revalidate=604800'
  }

  // Document navigations / SSR HTML
  if (!pathname.includes('.') || pathname.endsWith('/')) {
    return 'private, no-cache'
  }

  return null
}
