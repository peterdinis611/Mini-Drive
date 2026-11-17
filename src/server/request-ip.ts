import { getRequestHeaders, getRequestIP } from '@tanstack/react-start/server'

/**
 * Client IP behind Cloudflare / reverse proxies.
 * Prefer CF-Connecting-IP, then left-most X-Forwarded-For when TRUST_PROXY=1,
 * else the socket address (safe default — spoof-resistant without a trusted proxy).
 */
export function resolveClientIp(): string {
  const headers = getRequestHeaders()
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const trustProxy =
    process.env.TRUST_PROXY === '1' ||
    process.env.TRUST_PROXY === 'true' ||
    Boolean(process.env.CF_PAGES || process.env.VERCEL)

  if (trustProxy) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (forwarded) return forwarded
    const realIp = headers.get('x-real-ip')?.trim()
    if (realIp) return realIp
    return getRequestIP({ xForwardedFor: true }) ?? 'unknown'
  }

  return getRequestIP() ?? 'unknown'
}
